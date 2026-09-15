import { beforeEach, describe, expect, it, vi } from "vitest";

const updateCompany = vi.fn();
const updateSiteAnalysis = vi.fn();
const updateDiagnostic = vi.fn();
const trackEvent = vi.fn();

vi.mock("@/lib/database", () => ({
  companies: { updateCompany },
  siteAnalyses: { updateSiteAnalysis },
  diagnostics: { updateDiagnostic },
  analyticsEvents: { trackEvent },
}));

const { confirmSiteAnalysis } = await import("@/server/confirm-site-analysis");
const { rejectSiteAnalysis } = await import("@/server/reject-site-analysis");
const { continueWithoutSiteAnalysis } = await import(
  "@/server/continue-without-site-analysis"
);

const baseFields = {
  description: "Plataforma de automação comercial B2B.",
  segment: "Tecnologia",
  mainOffer: "Automação de vendas",
  targetAudience: "Empresas B2B de médio porte",
  businessModel: "SaaS por assinatura",
  differentiators: ["Suporte 24/7", "Integração com ERP"],
  commercialProofs: ["+500 clientes ativos"],
  conversionMechanisms: ["Formulário de contato", "Botão de WhatsApp"],
};

beforeEach(() => {
  vi.clearAllMocks();

  updateCompany.mockResolvedValue({ id: "company-1" });
  updateSiteAnalysis.mockResolvedValue({ id: "site-analysis-1", status: "confirmed" });
  updateDiagnostic.mockResolvedValue({
    id: "diagnostic-1",
    status: "company_confirmed",
  });
  trackEvent.mockResolvedValue({ id: "event-1" });
});

describe("confirmSiteAnalysis", () => {
  it("grava todos os campos do perfil com source 'confirmed' quando não editado", async () => {
    await confirmSiteAnalysis({
      diagnosticId: "diagnostic-1",
      companyId: "company-1",
      siteAnalysisId: "site-analysis-1",
      edited: false,
      fields: baseFields,
    });

    expect(updateCompany).toHaveBeenCalledWith("company-1", {
      description: baseFields.description,
      segment: baseFields.segment,
      main_offer: baseFields.mainOffer,
      target_audience: baseFields.targetAudience,
      business_model: baseFields.businessModel,
      differentiators: baseFields.differentiators,
      commercial_proofs: baseFields.commercialProofs,
      conversion_mechanisms: baseFields.conversionMechanisms,
      profile_sources: {
        description: "confirmed",
        segment: "confirmed",
        main_offer: "confirmed",
        target_audience: "confirmed",
        business_model: "confirmed",
        differentiators: "confirmed",
        commercial_proofs: "confirmed",
        conversion_mechanisms: "confirmed",
      },
    });
  });

  it("marca a origem dos campos como 'edited' quando a pessoa ajustou algo", async () => {
    await confirmSiteAnalysis({
      diagnosticId: "diagnostic-1",
      companyId: "company-1",
      siteAnalysisId: "site-analysis-1",
      edited: true,
      fields: baseFields,
    });

    const [, patch] = updateCompany.mock.calls[0] as [string, { profile_sources: unknown }];
    expect(patch.profile_sources).toMatchObject({ description: "edited", segment: "edited" });
  });

  it("marca a site_analyses como 'confirmed' e o diagnóstico como 'company_confirmed'", async () => {
    await confirmSiteAnalysis({
      diagnosticId: "diagnostic-1",
      companyId: "company-1",
      siteAnalysisId: "site-analysis-1",
      edited: false,
      fields: baseFields,
    });

    expect(updateSiteAnalysis).toHaveBeenCalledWith("site-analysis-1", {
      status: "confirmed",
    });
    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "company_confirmed",
    });
  });

  it("registra o evento company_analysis_confirmed com a flag 'edited'", async () => {
    await confirmSiteAnalysis({
      diagnosticId: "diagnostic-1",
      companyId: "company-1",
      siteAnalysisId: "site-analysis-1",
      edited: true,
      fields: baseFields,
    });

    expect(trackEvent).toHaveBeenCalledWith({
      diagnostic_id: "diagnostic-1",
      event_name: "company_analysis_confirmed",
      event_data: { edited: true },
    });
  });

  it("não falha quando não há siteAnalysisId (segue sem marcar a análise)", async () => {
    await confirmSiteAnalysis({
      diagnosticId: "diagnostic-1",
      companyId: "company-1",
      siteAnalysisId: null,
      edited: false,
      fields: baseFields,
    });

    expect(updateSiteAnalysis).not.toHaveBeenCalled();
    expect(updateCompany).toHaveBeenCalled();
  });
});

describe("rejectSiteAnalysis", () => {
  it("marca a análise como 'rejected' e avança o diagnóstico sem tocar em companies", async () => {
    await rejectSiteAnalysis({
      diagnosticId: "diagnostic-1",
      siteAnalysisId: "site-analysis-1",
    });

    expect(updateSiteAnalysis).toHaveBeenCalledWith("site-analysis-1", {
      status: "rejected",
    });
    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "company_confirmed",
    });
    expect(updateCompany).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith({
      diagnostic_id: "diagnostic-1",
      event_name: "company_analysis_rejected",
    });
  });
});

describe("continueWithoutSiteAnalysis", () => {
  it("marca a análise como 'skipped' apenas no caso 'user_declined'", async () => {
    await continueWithoutSiteAnalysis({
      diagnosticId: "diagnostic-1",
      reason: "user_declined",
      siteAnalysisId: "site-analysis-1",
    });

    expect(updateSiteAnalysis).toHaveBeenCalledWith("site-analysis-1", {
      status: "skipped",
    });
  });

  it("não marca nenhuma análise para os motivos 'no_website' e 'failed'", async () => {
    await continueWithoutSiteAnalysis({ diagnosticId: "diagnostic-1", reason: "no_website" });
    await continueWithoutSiteAnalysis({ diagnosticId: "diagnostic-1", reason: "failed" });

    expect(updateSiteAnalysis).not.toHaveBeenCalled();
  });

  it("registra o evento company_analysis_skipped com o motivo", async () => {
    await continueWithoutSiteAnalysis({ diagnosticId: "diagnostic-1", reason: "failed" });

    expect(trackEvent).toHaveBeenCalledWith({
      diagnostic_id: "diagnostic-1",
      event_name: "company_analysis_skipped",
      event_data: { reason: "failed" },
    });
  });

  it("avança o diagnóstico para 'company_confirmed' em todos os casos", async () => {
    await continueWithoutSiteAnalysis({ diagnosticId: "diagnostic-1", reason: "no_website" });

    expect(updateDiagnostic).toHaveBeenCalledWith("diagnostic-1", {
      status: "company_confirmed",
    });
  });
});
