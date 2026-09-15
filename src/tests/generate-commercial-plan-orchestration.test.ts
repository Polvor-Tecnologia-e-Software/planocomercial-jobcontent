import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const findCachedReport = vi.fn();
const countReportsForDiagnostic = vi.fn();
const createAiReport = vi.fn();
const updateAiReportStatus = vi.fn();
const buildCommercialPlanContext = vi.fn();
const generateCommercialPlanContent = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById },
  aiReports: { findCachedReport, countReportsForDiagnostic, createAiReport, updateAiReportStatus },
}));

vi.mock("@/server/build-commercial-plan-context", () => ({ buildCommercialPlanContext }));
vi.mock("@/lib/ai/commercial-plan", () => ({ generateCommercialPlanContent }));

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "chave-de-teste",
    AI_MODEL: "modelo-de-teste",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    APP_URL: "https://exemplo.com",
  }),
}));

const { generateCommercialPlan } = await import("@/server/generate-commercial-plan");
const { AiResponseValidationError } = await import("@/lib/ai/errors");
const { AiCallError } = await import("@/lib/ai/client");

function makeDiagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "prediagnosis_ready",
    selected_challenge: "D2",
    current_step: "D2_Q2",
    overall_score: 45,
    maturity_stage: null,
    primary_bottleneck: "conversion",
    secondary_risk: null,
    data_quality_percentage: 60,
    confidence_level: "medium",
    started_at: "2026-01-01T00:00:00.000Z",
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function baseContext(overrides: Record<string, unknown> = {}) {
  return {
    company: null,
    selectedChallenge: "D2",
    relevantAnswers: [{ questionKey: "U1", prompt: "Qual é o ticket médio?", answer: "1000" }],
    funnelAnalysis: { requiredFunnel: {}, gaps: {}, conversionRates: {}, missingData: [] },
    primaryBottleneckCandidate: "conversion",
    secondaryRiskCandidate: null,
    signals: [],
    dataQuality: { percentage: 60, confidence: "medium" },
    scores: [],
    candidateActions: [],
    ...overrides,
  };
}

function validPlan(overrides: Record<string, unknown> = {}) {
  return {
    executiveDiagnosis: "Diagnóstico executivo.",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "Evidência.", source: "declared_answer" }],
    rootCause: { description: "Causa raiz.", evidence: [{ summary: "x", source: "declared_answer" }] },
    goalGapInterpretation: "Interpretação do gap.",
    priorities: [1, 2, 3].map((n) => ({
      title: `Prioridade ${n}`,
      rationale: "Motivo",
      problemSolved: "Problema",
      expectedImpact: "Impacto",
      primaryIndicator: "Indicador",
      timeframe: "30 dias",
    })),
    plan90Days: {
      days1to30: [
        {
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 1",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 1,
        },
      ],
      days31to60: [
        {
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 5",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 2,
        },
      ],
      days61to90: [
        {
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 9",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 3,
        },
      ],
    },
    weeklyManagerAgenda: [{ focus: "Foco", activities: ["Atividade"] }],
    indicators: [{ name: "Taxa", currentValue: null, targetValue: null, frequency: "weekly" }],
    limitations: ["Limitação."],
    consultativeCta: { message: "CTA." },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  countReportsForDiagnostic.mockResolvedValue(0);
  createAiReport.mockResolvedValue({ id: "report-1" });
  updateAiReportStatus.mockResolvedValue({ id: "report-1" });
  findCachedReport.mockResolvedValue(null);
});

describe("generateCommercialPlan — pré-condições", () => {
  it("não roda nada quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    const result = await generateCommercialPlan("inexistente");
    expect(result).toEqual({ status: "skipped", reason: "diagnostic_not_found" });
    expect(buildCommercialPlanContext).not.toHaveBeenCalled();
  });

  it("não roda nada quando não há desafio selecionado", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: null }));
    const result = await generateCommercialPlan("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "challenge_not_selected" });
  });
});

describe("generateCommercialPlan — gargalos diferentes chegam até a chamada de IA", () => {
  it.each(["demand", "conversion", "processes"])("gera plano com contexto de gargalo %s", async (dimension) => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ primary_bottleneck: dimension }));
    buildCommercialPlanContext.mockResolvedValue(
      baseContext({ primaryBottleneckCandidate: dimension }),
    );
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan({ primaryBottleneck: dimension }),
      inputTokens: 500,
      outputTokens: 800,
      model: "modelo-de-teste",
      latencyMs: 1200,
    });

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result.status).toBe("generated");
    expect(generateCommercialPlanContent).toHaveBeenCalledWith(
      expect.objectContaining({ primaryBottleneckCandidate: dimension }),
    );
  });

  it("dados incompletos (missingData preenchido) ainda gera o plano — a IA interpreta a lacuna, não bloqueia", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    buildCommercialPlanContext.mockResolvedValue(
      baseContext({
        funnelAnalysis: {
          requiredFunnel: {},
          gaps: {},
          conversionRates: {},
          missingData: ["monthlyGoal", "currentMonthlySales"],
        },
      }),
    );
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan(),
      inputTokens: 400,
      outputTokens: 700,
      model: "modelo-de-teste",
      latencyMs: 900,
    });

    const result = await generateCommercialPlan("diagnostic-1");
    expect(result.status).toBe("generated");
  });

  it("baixa confiança de dados (dataQuality.confidence='low') ainda gera o plano normalmente", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ confidence_level: "low", data_quality_percentage: 20 }));
    buildCommercialPlanContext.mockResolvedValue(
      baseContext({ dataQuality: { percentage: 20, confidence: "low" } }),
    );
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan(),
      inputTokens: 400,
      outputTokens: 700,
      model: "modelo-de-teste",
      latencyMs: 900,
    });

    const result = await generateCommercialPlan("diagnostic-1");
    expect(result.status).toBe("generated");
  });
});

describe("generateCommercialPlan — falhas nunca perdem o diagnóstico", () => {
  beforeEach(() => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    buildCommercialPlanContext.mockResolvedValue(baseContext());
  });

  it("IA retorna JSON inválido -> status failed, motivo invalid_output, relatório marcado como failed", async () => {
    generateCommercialPlanContent.mockRejectedValue(
      new AiResponseValidationError("schema não bate", {}),
    );

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "invalid_output", reportId: "report-1" });
    expect(updateAiReportStatus).toHaveBeenCalledWith("report-1", "failed");
  });

  it("timeout/indisponibilidade -> status failed, motivo transport_error", async () => {
    generateCommercialPlanContent.mockRejectedValue(
      new AiCallError("excedeu o tempo limite", false),
    );

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "transport_error", reportId: "report-1" });
  });

  it("número não rastreável ao contexto -> rejeitado, status failed, motivo invalid_output", async () => {
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan({ goalGapInterpretation: "A conversão está travada em exatos 47% hoje." }),
      inputTokens: 400,
      outputTokens: 700,
      model: "modelo-de-teste",
      latencyMs: 900,
    });

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "invalid_output", reportId: "report-1" });
  });

  it("respeita o limite de tentativas por diagnóstico (evita custo ilimitado de retry)", async () => {
    countReportsForDiagnostic.mockResolvedValue(3);

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "too_many_attempts", reportId: null });
    expect(generateCommercialPlanContent).not.toHaveBeenCalled();
  });
});

describe("generateCommercialPlan — cache", () => {
  beforeEach(() => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    buildCommercialPlanContext.mockResolvedValue(baseContext());
  });

  it("cache hit: retorna o relatório salvo sem chamar a IA de novo", async () => {
    findCachedReport.mockResolvedValue({ id: "report-cached", response_json: validPlan() });

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result.status).toBe("cached");
    expect(generateCommercialPlanContent).not.toHaveBeenCalled();
    expect(createAiReport).not.toHaveBeenCalled();
  });

  it("alteração do input (contexto diferente) muda o hash e invalida o cache — chama a IA de novo", async () => {
    findCachedReport.mockResolvedValue(null); // simula que o hash não bateu com nada em cache
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan(),
      inputTokens: 400,
      outputTokens: 700,
      model: "modelo-de-teste",
      latencyMs: 900,
    });

    const result = await generateCommercialPlan("diagnostic-1");

    expect(result.status).toBe("generated");
    expect(generateCommercialPlanContent).toHaveBeenCalledTimes(1);
  });

  it("cache com response_json corrompido (não bate mais com o schema) é tratado como cache miss, não trava", async () => {
    findCachedReport.mockResolvedValue({ id: "report-cached", response_json: { formato: "antigo" } });
    generateCommercialPlanContent.mockResolvedValue({
      plan: validPlan(),
      inputTokens: 400,
      outputTokens: 700,
      model: "modelo-de-teste",
      latencyMs: 900,
    });

    const result = await generateCommercialPlan("diagnostic-1");
    expect(result.status).toBe("generated");
  });
});
