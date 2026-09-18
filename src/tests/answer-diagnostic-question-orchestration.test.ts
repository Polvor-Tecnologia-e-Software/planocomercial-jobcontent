import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const updateDiagnostic = vi.fn();
const listAnswers = vi.fn();
const upsertAnswer = vi.fn();
const trackEvent = vi.fn();
const runDeterministicAnalysis = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById, updateDiagnostic },
  diagnosticAnswers: { listAnswers, upsertAnswer },
  analyticsEvents: { trackEvent },
}));

vi.mock("@/server/run-deterministic-analysis", () => ({ runDeterministicAnalysis }));

const { answerDiagnosticQuestion } = await import("@/server/answer-diagnostic-question");

function makeDiagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "challenge_selected",
    selected_challenge: "D1",
    current_step: null,
    overall_score: null,
    maturity_stage: null,
    primary_bottleneck: null,
    secondary_risk: null,
    data_quality_percentage: null,
    confidence_level: null,
    started_at: "2026-01-01T00:00:00.000Z",
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  listAnswers.mockResolvedValue([]);
  upsertAnswer.mockResolvedValue({ id: "answer-1" });
  trackEvent.mockResolvedValue({ id: "event-1" });
  runDeterministicAnalysis.mockResolvedValue({ status: "completed" });
  updateDiagnostic.mockImplementation(async (id: string, patch: Record<string, unknown>) =>
    makeDiagnostic({ id, ...patch }),
  );
});

describe("answerDiagnosticQuestion — segurança e validação server-side", () => {
  it("rejeita quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);

    const result = await answerDiagnosticQuestion({
      diagnosticId: "inexistente",
      questionKey: "U1",
      rawValue: 100,
    });

    expect(result).toEqual({ status: "error", reason: "diagnostic_not_found" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita quando o diagnóstico ainda não tem desafio selecionado", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: null }));

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "U1",
      rawValue: 100,
    });

    expect(result).toEqual({ status: "error", reason: "challenge_not_selected" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita uma question_key que não existe em nenhum catálogo (manipulação de payload)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "CHAVE_FORJADA",
      rawValue: "x",
    });

    expect(result).toEqual({ status: "error", reason: "unknown_question" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita uma pergunta que existe no catálogo mas ainda não está na rota aplicável (tentando pular etapas)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([]); // U1 ainda não respondida -> D1_Q1 não está aplicável

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "D1_Q1",
      rawValue: "outbound",
    });

    expect(result).toEqual({ status: "error", reason: "not_applicable" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita regravar uma pergunta que saiu da rota porque uma resposta anterior mudou", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    // D1_Q1 = "outbound" -> D1_Q3 (que exigia "nao_sei") não está mais aplicável.
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1 },
      { question_key: "U2", answer_value: 1 },
      { question_key: "U3", answer_value: 1 },
      { question_key: "D1_Q1", answer_value: "outbound" },
    ]);

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "D1_Q3",
      rawValue: "sim",
    });

    expect(result).toEqual({ status: "error", reason: "not_applicable" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita um valor fora das opções permitidas para single_select", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1 },
      { question_key: "U2", answer_value: 1 },
      { question_key: "U3", answer_value: 1 },
    ]);

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "D1_Q1",
      rawValue: "valor-forjado",
    });

    expect(result).toEqual({ status: "error", reason: "invalid_value" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });

  it("rejeita um número inválido/extremo", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "U1",
      rawValue: "não-é-um-número",
    });

    expect(result).toEqual({ status: "error", reason: "invalid_value" });
    expect(upsertAnswer).not.toHaveBeenCalled();
  });
});

describe("answerDiagnosticQuestion — persistência e transição de status", () => {
  it("salva via upsert (nunca insert direto) e avança para adaptive_in_progress na primeira resposta", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "challenge_selected" }));
    listAnswers.mockResolvedValue([]);

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "U1",
      rawValue: "5000",
    });

    expect(upsertAnswer).toHaveBeenCalledTimes(1);
    expect(upsertAnswer).toHaveBeenCalledWith({
      diagnosticId: "diagnostic-1",
      questionKey: "U1",
      answerValue: 5000,
      answerSource: "user",
      confirmed: true,
    });
    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "adaptive_in_progress",
      current_step: "U1",
    });
    expect(result).toEqual(
      expect.objectContaining({ status: "saved", isComplete: false, value: 5000 }),
    );
    // Regressão: o motor determinístico nunca deve rodar antes da jornada
    // de perguntas terminar de verdade.
    expect(runDeterministicAnalysis).not.toHaveBeenCalled();
  });

  it("mudar uma resposta já dada continua chamando upsert (mesma question_key, sem duplicar)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "adaptive_in_progress" }));
    listAnswers.mockResolvedValue([{ question_key: "U1", answer_value: 1000 }]);

    await answerDiagnosticQuestion({ diagnosticId: "diagnostic-1", questionKey: "U1", rawValue: "2000" });

    expect(upsertAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ questionKey: "U1", answerValue: 2000 }),
    );
  });

  it("avança o status para prediagnosis_ready ao responder a última pergunta aplicável", async () => {
    // D5 com D5_Q1="sim_atualizado": rota completa é U1-U10,D5_Q1,D5_Q2 (D5_Q3 nunca se aplica).
    getDiagnosticById.mockResolvedValue(
      makeDiagnostic({ selected_challenge: "D5", status: "adaptive_in_progress" }),
    );
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1000 },
      { question_key: "U2", answer_value: 30 },
      { question_key: "U3", answer_value: 2 },
      { question_key: "U4", answer_value: 100_000 },
      { question_key: "U5", answer_value: 12 },
      { question_key: "U10", answer_value: 60_000 },
      { question_key: "U6", answer_value: 50 },
      { question_key: "U7", answer_value: 20 },
      { question_key: "U8", answer_value: 15 },
      { question_key: "U9", answer_value: 10 },
      { question_key: "U11", answer_value: "usa_estruturado" },
      { question_key: "D5_Q1", answer_value: "sim_atualizado" },
    ]);

    const result = await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "D5_Q2",
      rawValue: "qualquer_um",
    });

    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "prediagnosis_ready",
      current_step: "D5_Q2",
    });
    expect(result).toEqual(
      expect.objectContaining({ status: "saved", isComplete: true, value: "qualquer_um" }),
    );
  });

  it("dispara o motor determinístico (score/gargalo/qualidade de dados) exatamente quando a jornada termina — bug real: sem isso, o diagnóstico nunca calcula nada no fluxo normal", async () => {
    getDiagnosticById.mockResolvedValue(
      makeDiagnostic({ selected_challenge: "D5", status: "adaptive_in_progress" }),
    );
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1000 },
      { question_key: "U2", answer_value: 30 },
      { question_key: "U3", answer_value: 2 },
      { question_key: "U4", answer_value: 100_000 },
      { question_key: "U5", answer_value: 12 },
      { question_key: "U10", answer_value: 60_000 },
      { question_key: "U6", answer_value: 50 },
      { question_key: "U7", answer_value: 20 },
      { question_key: "U8", answer_value: 15 },
      { question_key: "U9", answer_value: 10 },
      { question_key: "U11", answer_value: "usa_estruturado" },
      { question_key: "D5_Q1", answer_value: "sim_atualizado" },
    ]);

    await answerDiagnosticQuestion({
      diagnosticId: "diagnostic-1",
      questionKey: "D5_Q2",
      rawValue: "qualquer_um",
    });

    expect(runDeterministicAnalysis).toHaveBeenCalledWith("diagnostic-1");
    expect(runDeterministicAnalysis).toHaveBeenCalledTimes(1);
  });

  it("registra o evento diagnostic_answer_saved com a question_key e o status resultante", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([]);

    await answerDiagnosticQuestion({ diagnosticId: "diagnostic-1", questionKey: "U1", rawValue: 100 });

    expect(trackEvent).toHaveBeenCalledWith({
      diagnostic_id: "diagnostic-1",
      event_name: "diagnostic_answer_saved",
      event_data: { question_key: "U1", status: "adaptive_in_progress" },
    });
  });

  it.each(["D1", "D2", "D3", "D4", "D5", "D6"] as const)(
    "aceita a primeira pergunta universal para todos os 6 desafios (%s)",
    async (challenge) => {
      getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: challenge }));
      listAnswers.mockResolvedValue([]);

      const result = await answerDiagnosticQuestion({
        diagnosticId: "diagnostic-1",
        questionKey: "U1",
        rawValue: 100,
      });

      expect(result.status).toBe("saved");
    },
  );
});
