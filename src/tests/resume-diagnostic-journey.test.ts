import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const updateDiagnostic = vi.fn();
const listAnswers = vi.fn();
const runDeterministicAnalysis = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById, updateDiagnostic },
  diagnosticAnswers: { listAnswers },
}));

vi.mock("@/server/run-deterministic-analysis", () => ({ runDeterministicAnalysis }));

const { resumeDiagnosticJourney } = await import("@/server/resume-diagnostic-journey");

function makeDiagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "adaptive_in_progress",
    selected_challenge: "D5",
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

const COMPLETE_D5_ANSWERS = [
  { question_key: "U1", answer_value: 1000 },
  { question_key: "U2", answer_value: 30 },
  { question_key: "U3", answer_value: 2 },
  { question_key: "U4", answer_value: 100_000 },
  { question_key: "U5", answer_value: 12 },
  { question_key: "U6", answer_value: 50 },
  { question_key: "U7", answer_value: 20 },
  { question_key: "U8", answer_value: 15 },
  { question_key: "U9", answer_value: 10 },
  { question_key: "D5_Q1", answer_value: "sim_atualizado" },
  { question_key: "D5_Q2", answer_value: "qualquer_um" },
];

beforeEach(() => {
  vi.clearAllMocks();
  runDeterministicAnalysis.mockResolvedValue({ status: "completed" });
});

describe("resumeDiagnosticJourney", () => {
  it("retorna null quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    expect(await resumeDiagnosticJourney("inexistente")).toBeNull();
  });

  it("retorna null quando ainda não há desafio selecionado", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: null }));
    expect(await resumeDiagnosticJourney("diagnostic-1")).toBeNull();
  });

  it("retoma no meio da rota: reconstrói o progresso e sinaliza isComplete=false", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([{ question_key: "U1", answer_value: 1000 }]);

    const state = await resumeDiagnosticJourney("diagnostic-1");

    expect(state?.isComplete).toBe(false);
    expect(state?.progress.answeredCount).toBe(1);
    expect(updateDiagnostic).not.toHaveBeenCalled();
    expect(runDeterministicAnalysis).not.toHaveBeenCalled();
  });

  it("auto-cura o status para prediagnosis_ready quando tudo já foi respondido mas o status ficou para trás, e dispara o motor determinístico", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "adaptive_in_progress" }));
    listAnswers.mockResolvedValue(COMPLETE_D5_ANSWERS);
    updateDiagnostic.mockResolvedValue(makeDiagnostic({ status: "prediagnosis_ready" }));

    const state = await resumeDiagnosticJourney("diagnostic-1");

    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", { status: "prediagnosis_ready" });
    expect(runDeterministicAnalysis).toHaveBeenCalledWith("diagnostic-1");
    expect(state?.isComplete).toBe(true);
    expect(state?.diagnostic.status).toBe("prediagnosis_ready");
  });

  it("não regrava o status nem redispara o motor quando já está prediagnosis_ready e de fato está completo", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "prediagnosis_ready" }));
    listAnswers.mockResolvedValue(COMPLETE_D5_ANSWERS);

    const state = await resumeDiagnosticJourney("diagnostic-1");

    expect(updateDiagnostic).not.toHaveBeenCalled();
    expect(runDeterministicAnalysis).not.toHaveBeenCalled();
    expect(state?.isComplete).toBe(true);
  });

  it("não cura (nem trava, nem dispara o motor) um status que não é challenge_selected/adaptive_in_progress mesmo se completo", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "completed" }));
    listAnswers.mockResolvedValue(COMPLETE_D5_ANSWERS);

    const state = await resumeDiagnosticJourney("diagnostic-1");

    expect(updateDiagnostic).not.toHaveBeenCalled();
    expect(runDeterministicAnalysis).not.toHaveBeenCalled();
    expect(state?.diagnostic.status).toBe("completed");
  });
});
