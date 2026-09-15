import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const getCompanyById = vi.fn();
const listAnswers = vi.fn();
const getFunnelAnalysis = vi.fn();
const listScores = vi.fn();
const listSignals = vi.fn();
const listActiveActionsByDimension = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById },
  companies: { getCompanyById },
  diagnosticAnswers: { listAnswers },
  funnelAnalyses: { getFunnelAnalysis },
  diagnosticScores: { listScores },
  diagnosticSignals: { listSignals },
  actionLibrary: { listActiveActionsByDimension },
}));

const { buildCommercialPlanContext } = await import("@/server/build-commercial-plan-context");

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

beforeEach(() => {
  vi.clearAllMocks();
  getCompanyById.mockResolvedValue(null);
  getFunnelAnalysis.mockResolvedValue(null);
  listScores.mockResolvedValue([]);
  listSignals.mockResolvedValue([]);
  listActiveActionsByDimension.mockResolvedValue([]);
});

describe("buildCommercialPlanContext", () => {
  it("retorna null quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    listAnswers.mockResolvedValue([]);
    expect(await buildCommercialPlanContext("x")).toBeNull();
  });

  it("retorna null quando não há desafio selecionado", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ selected_challenge: null }));
    listAnswers.mockResolvedValue([]);
    expect(await buildCommercialPlanContext("diagnostic-1")).toBeNull();
  });

  it("inclui só respostas aplicáveis ao desafio selecionado, com o texto da pergunta", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1000 },
      { question_key: "D2_Q1", answer_value: "existe_nao_seguido" },
      { question_key: "D2_Q2", answer_value: "10_30" },
      // Resposta órfã de outro desafio — nunca deveria aparecer no contexto.
      { question_key: "D5_Q1", answer_value: "sim_atualizado" },
    ]);

    const context = await buildCommercialPlanContext("diagnostic-1");

    const keys = context?.relevantAnswers.map((a) => a.questionKey) ?? [];
    expect(keys).toEqual(expect.arrayContaining(["U1", "D2_Q1", "D2_Q2"]));
    expect(keys).not.toContain("D5_Q1");
    expect(context?.relevantAnswers.find((a) => a.questionKey === "U1")?.prompt).toMatch(/ticket médio/i);
  });

  it("nunca inclui uma pergunta condicional que não chegou a ficar aplicável", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([
      { question_key: "U1", answer_value: 1000 },
      { question_key: "D2_Q1", answer_value: "sim" }, // D2_Q3 só aparece com "existe_nao_seguido"
      { question_key: "D2_Q3", answer_value: "resposta órfã" },
    ]);

    const context = await buildCommercialPlanContext("diagnostic-1");
    expect(context?.relevantAnswers.map((a) => a.questionKey)).not.toContain("D2_Q3");
  });

  it("usa o perfil CONFIRMADO da empresa (companies), nunca o site cru", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([]);
    getCompanyById.mockResolvedValue({
      id: "company-1",
      company_name: "CodeBit",
      segment: "software",
      main_offer: "Software sob medida",
      target_audience: "Gestores de TI",
      business_model: "Consultiva",
      differentiators: ["Entrega rápida", "Suporte dedicado"],
      commercial_proofs: ["Case X"],
      conversion_mechanisms: [],
      profile_sources: {},
      website: "codebit.com.br",
      normalized_website: "codebit.com.br",
      description: null,
      average_ticket: null,
      sales_cycle: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const context = await buildCommercialPlanContext("diagnostic-1");
    expect(context?.company).toEqual({
      name: "CodeBit",
      segment: "software",
      mainOffer: "Software sob medida",
      targetAudience: "Gestores de TI",
      businessModel: "Consultiva",
      differentiators: ["Entrega rápida", "Suporte dedicado"],
      commercialProofs: ["Case X"],
    });
  });

  it("converte taxas de conversão de fração (0-1) para percentual inteiro", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([]);
    getFunnelAnalysis.mockResolvedValue({
      id: "funnel-1",
      diagnostic_id: "diagnostic-1",
      current_funnel: {},
      required_funnel: { requiredCustomers: 10, requiredProposals: 20 },
      conversion_rates: { leadToOpportunity: { value: 0.2, source: "declared_bucket" } },
      gaps: { customers: { available: true, required: 10, current: 3, gap: 7 } },
      assumptions: [],
      missing_data: ["proposalToSaleRate"],
      completeness_percentage: 40,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const context = await buildCommercialPlanContext("diagnostic-1");
    expect(context?.funnelAnalysis.conversionRates.leadToOpportunity).toEqual({
      percent: 20,
      source: "declared_bucket",
    });
    expect(context?.funnelAnalysis.requiredFunnel.customers).toBe(10);
    expect(context?.funnelAnalysis.gaps.customers).toBe(7);
    expect(context?.funnelAnalysis.missingData).toEqual(["proposalToSaleRate"]);
  });

  it("busca ações candidatas para o gargalo principal E o risco secundário", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic({ primary_bottleneck: "conversion", secondary_risk: "processes" }));
    listAnswers.mockResolvedValue([]);

    await buildCommercialPlanContext("diagnostic-1");

    expect(listActiveActionsByDimension).toHaveBeenCalledWith("conversion");
    expect(listActiveActionsByDimension).toHaveBeenCalledWith("processes");
  });

  it("nunca lança quando a empresa/funil não existem — contexto continua utilizável", async () => {
    getDiagnosticById.mockResolvedValue(makeDiagnostic());
    listAnswers.mockResolvedValue([]);

    const context = await buildCommercialPlanContext("diagnostic-1");
    expect(context?.company).toBeNull();
    expect(context?.funnelAnalysis.missingData).toEqual([]);
  });
});
