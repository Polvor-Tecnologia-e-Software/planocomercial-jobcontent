import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const getCompanyById = vi.fn();
const getFunnelAnalysis = vi.fn();
const getLatestReport = vi.fn();
const getLatestAnalysisForDiagnostic = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById },
  companies: { getCompanyById },
  funnelAnalyses: { getFunnelAnalysis },
  aiReports: { getLatestReport },
  seoAnalyses: { getLatestAnalysisForDiagnostic },
}));

const { getCommercialPlanResult } = await import("@/server/get-commercial-plan-result");

function makeDiagnostic(overrides: Record<string, unknown> = {}) {
  return {
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "completed",
    selected_challenge: "D2",
    current_step: null,
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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          suggestedOwner: "Vendas",
          deadline: "Semana 9",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 3,
        },
      ],
    },
    weeklyManagerAgenda: [{ focus: "Foco", activities: ["Atividade"] }],
    indicators: [{ name: "Taxa", currentValue: "20%", targetValue: "35%", frequency: "weekly" }],
    limitations: ["Limitação."],
    consultativeCta: { message: "CTA." },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCompanyById.mockResolvedValue({ company_name: "CodeBit" });
  getFunnelAnalysis.mockResolvedValue(null);
  getLatestAnalysisForDiagnostic.mockResolvedValue(null);
});

describe("getCommercialPlanResult — acesso inválido", () => {
  it("retorna not_found quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    expect(await getCommercialPlanResult("inexistente")).toEqual({ status: "not_found" });
    // Nunca busca dados de outras tabelas para um diagnóstico inexistente.
    expect(getFunnelAnalysis).not.toHaveBeenCalled();
    expect(getLatestReport).not.toHaveBeenCalled();
    expect(getLatestAnalysisForDiagnostic).not.toHaveBeenCalled();
  });
});

describe("getCommercialPlanResult — estados sem plano", () => {
  it("not_generated quando nenhum relatório existe ainda", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "prediagnosis_ready" }));
    getLatestReport.mockResolvedValue(null);

    const result = await getCommercialPlanResult("diagnostic-1");
    expect(result).toEqual({ status: "not_generated", diagnosticId: "diagnostic-1", companyName: "CodeBit" });
  });

  it("generating quando o relatório mais recente está em andamento e é recente", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "generating" }));
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "generating",
      response_json: null,
      last_error: null,
      created_at: new Date().toISOString(),
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    expect(result.status).toBe("generating");
  });

  it("trata um 'generating' travado (velho) como failed, com possibilidade de tentar de novo", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "generating" }));
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "generating",
      response_json: null,
      last_error: null,
      created_at: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 minutos atrás
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    expect(result).toEqual(
      expect.objectContaining({ status: "failed", canRetry: true }),
    );
  });

  it("failed com o motivo persistido, permitindo nova tentativa", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "failed" }));
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "failed",
      response_json: null,
      last_error: "transport_error",
      created_at: "2026-01-01T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    expect(result).toEqual({
      status: "failed",
      diagnosticId: "diagnostic-1",
      companyName: "CodeBit",
      reason: "transport_error",
      canRetry: true,
    });
  });

  it("trata um response_json corrompido/fora do schema atual como failed recuperável, sem quebrar a página", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ status: "completed" }));
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: { formato: "antigo" },
      last_error: null,
      created_at: "2026-01-01T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    expect(result).toEqual(
      expect.objectContaining({ status: "failed", reason: "invalid_output", canRetry: true }),
    );
  });
});

describe("getCommercialPlanResult — relatório completo", () => {
  it("monta o resultado completo com plano validado e estágios do funil", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getFunnelAnalysis.mockResolvedValue({
      current_funnel: { leadsPerMonth: 100, currentMonthlySales: 3 },
      required_funnel: {},
      conversion_rates: { leadToOpportunity: { value: 0.2, source: "declared_bucket" } },
      gaps: { customers: { available: true, required: 10, current: 3, gap: 7 } },
      missing_data: [],
    });
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.plan.priorities).toHaveLength(3);
      expect(result.funnelStages.find((s) => s.key === "customers")).toEqual(
        expect.objectContaining({ current: 3, required: 10, gap: 7, uncalculable: false }),
      );
      expect(result.funnelStages.find((s) => s.key === "leads")).toEqual(
        expect.objectContaining({ current: 100, uncalculable: false }),
      );
    }
  });

  it("relatório parcial: falta de dados de funil marca os estágios sem dado como não calculáveis, sem inventar valor", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getFunnelAnalysis.mockResolvedValue(null); // nenhuma análise de funil ainda
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.funnelStages.every((stage) => stage.uncalculable)).toBe(true);
      expect(result.funnelStages).toHaveLength(5);
    }
  });

  it("converte taxas de fração (0-1) para percentual inteiro nos estágios do funil", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getFunnelAnalysis.mockResolvedValue({
      current_funnel: {},
      required_funnel: {},
      conversion_rates: { leadToOpportunity: { value: 0.35, source: "computed" } },
      gaps: {},
      missing_data: [],
    });
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    if (result.status === "completed") {
      expect(result.funnelStages.find((s) => s.key === "opportunities")?.ratePercent).toBe(35);
    }
  });

  it("preserva textos grandes do plano sem truncar (a validação de tamanho já é feita pelo schema da Etapa 3)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    const longText = "Diagnóstico detalhado. ".repeat(20);
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan({ executiveDiagnosis: longText.trim() }),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    if (result.status === "completed") {
      expect(result.plan.executiveDiagnosis).toBe(longText.trim());
    }
  });

  it("seoOpportunities vem vazio quando não há análise de SEO concluída", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });
    getLatestAnalysisForDiagnostic.mockResolvedValue(null);

    const result = await getCommercialPlanResult("diagnostic-1");
    if (result.status === "completed") {
      expect(result.seoOpportunities).toEqual([]);
    }
  });

  it("seoOpportunities vem preenchido quando existe uma análise de SEO concluída", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });
    getLatestAnalysisForDiagnostic.mockResolvedValue({
      id: "seo-1",
      status: "completed",
      keyword_ideas: [
        {
          keyword: "consultoria financeira",
          avgMonthlySearches: 1000,
          competition: "low",
          opportunityRank: 1,
          coverageGap: true,
        },
      ],
    });

    const result = await getCommercialPlanResult("diagnostic-1");
    if (result.status === "completed") {
      expect(result.seoOpportunities).toEqual([
        {
          keyword: "consultoria financeira",
          avgMonthlySearches: 1000,
          competition: "low",
          opportunityRank: 1,
          coverageGap: true,
        },
      ]);
    }
  });

  it("seoOpportunities vem vazio quando a análise mais recente não está concluída (ex.: failed)", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    getLatestReport.mockResolvedValue({
      id: "report-1",
      status: "validated",
      response_json: validPlan(),
      last_error: null,
      created_at: "2026-01-05T00:00:00.000Z",
    });
    getLatestAnalysisForDiagnostic.mockResolvedValue({ id: "seo-1", status: "failed", keyword_ideas: null });

    const result = await getCommercialPlanResult("diagnostic-1");
    if (result.status === "completed") {
      expect(result.seoOpportunities).toEqual([]);
    }
  });
});
