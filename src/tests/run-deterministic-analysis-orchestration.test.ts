import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const updateDiagnostic = vi.fn();
const listAnswers = vi.fn();
const upsertScore = vi.fn();
const replaceSignals = vi.fn();
const upsertFunnelAnalysis = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById, updateDiagnostic },
  diagnosticAnswers: { listAnswers },
  diagnosticScores: { upsertScore },
  diagnosticSignals: { replaceSignals },
  funnelAnalyses: { upsertFunnelAnalysis },
}));

const { runDeterministicAnalysis } = await import("@/server/run-deterministic-analysis");

function makeDiagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "prediagnosis_ready",
    selected_challenge: "D1",
    current_step: "D1_Q1",
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
  listAnswers.mockResolvedValue([
    { question_key: "U1", answer_value: 1000 },
    { question_key: "U2", answer_value: 30 },
    { question_key: "U3", answer_value: 2 },
    { question_key: "D1_Q1", answer_value: "indicacao" },
    { question_key: "U6", answer_value: 5 },
  ]);
  upsertScore.mockResolvedValue({ id: "score-1" });
  replaceSignals.mockResolvedValue([]);
  upsertFunnelAnalysis.mockResolvedValue({ id: "funnel-1" });
});

describe("runDeterministicAnalysis — segurança e pré-condições", () => {
  it("não roda nada quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);

    const result = await runDeterministicAnalysis("inexistente");

    expect(result).toEqual({ status: "skipped", reason: "diagnostic_not_found" });
    expect(upsertScore).not.toHaveBeenCalled();
    expect(replaceSignals).not.toHaveBeenCalled();
    expect(upsertFunnelAnalysis).not.toHaveBeenCalled();
    expect(updateDiagnostic).not.toHaveBeenCalled();
  });

  it("não roda nada quando ainda não há desafio selecionado", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: null }));

    const result = await runDeterministicAnalysis("diagnostic-1");

    expect(result).toEqual({ status: "skipped", reason: "challenge_not_selected" });
    expect(listAnswers).not.toHaveBeenCalled();
  });

  it("só lê diagnostic_answers do diagnosticId informado, nunca de outro", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic());

    await runDeterministicAnalysis("diagnostic-1");

    expect(listAnswers).toHaveBeenCalledWith("diagnostic-1");
    expect(listAnswers).toHaveBeenCalledTimes(1);
  });
});

describe("runDeterministicAnalysis — persistência", () => {
  it("grava um score por dimensão (6 dimensões) via upsert", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic());

    await runDeterministicAnalysis("diagnostic-1");

    expect(upsertScore).toHaveBeenCalledTimes(6);
    expect(upsertScore).toHaveBeenCalledWith(
      expect.objectContaining({ diagnostic_id: "diagnostic-1", dimension: "demand" }),
    );
  });

  it("substitui (nunca acumula) os sinais do diagnóstico", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic());

    await runDeterministicAnalysis("diagnostic-1");

    expect(replaceSignals).toHaveBeenCalledTimes(1);
    const [calledDiagnosticId, calledSignals] = replaceSignals.mock.calls[0];
    expect(calledDiagnosticId).toBe("diagnostic-1");
    // D1_Q1 = "indicacao" -> DEPENDENCY_REFERRAL; U6 = 5 (< 20) -> LOW_NEW_LEADS_VOLUME
    expect(calledSignals.map((s: { signal_code: string }) => s.signal_code)).toEqual(
      expect.arrayContaining(["DEPENDENCY_REFERRAL", "LOW_NEW_LEADS_VOLUME"]),
    );
  });

  it("grava a análise de funil (upsert único por diagnóstico)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic());

    await runDeterministicAnalysis("diagnostic-1");

    expect(upsertFunnelAnalysis).toHaveBeenCalledTimes(1);
    expect(upsertFunnelAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ diagnostic_id: "diagnostic-1" }),
    );
  });

  it("atualiza o diagnóstico com score geral, gargalo, qualidade de dados e confiança", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic({ overall_score: 40 }));

    await runDeterministicAnalysis("diagnostic-1");

    expect(updateDiagnostic).toHaveBeenCalledWith(
      "diagnostic-1",
      expect.objectContaining({
        overall_score: expect.any(Number),
        primary_bottleneck: expect.anything(),
        data_quality_percentage: expect.any(Number),
        confidence_level: expect.stringMatching(/low|medium|high/),
      }),
    );
  });

  it("é seguro rodar mais de uma vez seguida para o mesmo diagnóstico (idempotente)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic());

    await runDeterministicAnalysis("diagnostic-1");
    await runDeterministicAnalysis("diagnostic-1");

    expect(upsertScore).toHaveBeenCalledTimes(12); // 6 dimensões x 2 execuções, nunca duplicando por outro mecanismo
    expect(replaceSignals).toHaveBeenCalledTimes(2);
  });

  it("retorna o diagnóstico atualizado e a análise completa", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    updateDiagnostic.mockResolvedValue(makeDiagnostic({ overall_score: 40 }));

    const result = await runDeterministicAnalysis("diagnostic-1");

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.analysis.score.dimensions.demand.weight).toBeGreaterThan(0);
      expect(result.analysis.signals.length).toBeGreaterThan(0);
      expect(result.analysis.bottleneck).toBeDefined();
    }
  });
});
