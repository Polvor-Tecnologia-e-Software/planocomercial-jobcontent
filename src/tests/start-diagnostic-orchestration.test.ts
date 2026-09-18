import { beforeEach, describe, expect, it, vi } from "vitest";

const findOrCreateCompany = vi.fn();
const updateCompany = vi.fn();
const createLead = vi.fn();
const recordConsent = vi.fn();
const createDiagnostic = vi.fn();
const trackEvent = vi.fn();

vi.mock("@/lib/database", () => ({
  companies: { findOrCreateCompany, updateCompany },
  leads: { createLead, recordConsent },
  diagnostics: { createDiagnostic },
  analyticsEvents: { trackEvent },
}));

const { startDiagnostic } = await import("@/server/start-diagnostic");

beforeEach(() => {
  vi.clearAllMocks();

  findOrCreateCompany.mockResolvedValue({
    id: "company-1",
    company_name: "CodeBit Tecnologia",
    website: "codebit.com.br",
  });

  updateCompany.mockResolvedValue({
    id: "company-1",
    company_name: "CodeBit Tecnologia",
    website: "codebit.com.br",
  });

  createLead.mockResolvedValue({
    id: "lead-1",
    company_id: "company-1",
    name: "Maria Souza",
    email: "maria@codebit.com.br",
  });

  recordConsent.mockResolvedValue({ id: "lead-1", consent_given: true });

  createDiagnostic.mockResolvedValue({
    id: "diagnostic-1",
    company_id: "company-1",
    lead_id: "lead-1",
    status: "started",
  });

  trackEvent.mockResolvedValue({ id: "event-1" });
});

describe("startDiagnostic", () => {
  it("cria a empresa, o lead e o diagnóstico com status started", async () => {
    const keywords = ["consultoria financeira", "planejamento tributário", "abertura de empresa", "contabilidade", "assessoria fiscal"];

    const result = await startDiagnostic({
      name: "Maria Souza",
      companyName: "CodeBit Tecnologia",
      website: "codebit.com.br",
      email: "maria@codebit.com.br",
      keywords,
      utm: { source: "google", medium: "cpc" },
    });

    expect(findOrCreateCompany).toHaveBeenCalledWith({
      company_name: "CodeBit Tecnologia",
      website: "codebit.com.br",
      keywords,
    });

    expect(updateCompany).toHaveBeenCalledWith("company-1", { keywords });

    expect(createLead).toHaveBeenCalledWith({
      company_id: "company-1",
      name: "Maria Souza",
      phone: null,
      email: "maria@codebit.com.br",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    });

    expect(createDiagnostic).toHaveBeenCalledWith({
      company_id: "company-1",
      lead_id: "lead-1",
      status: "started",
    });

    expect(result).toEqual(
      expect.objectContaining({ id: "diagnostic-1", status: "started" }),
    );
  });

  it("passa o telefone para createLead quando informado", async () => {
    await startDiagnostic({
      name: "Maria Souza",
      phone: "(11) 98765-4321",
      companyName: "CodeBit Tecnologia",
      website: "codebit.com.br",
      email: "maria@codebit.com.br",
      keywords: ["a", "b", "c", "d", "e"],
    });

    expect(createLead).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "(11) 98765-4321" }),
    );
  });

  it("registra o consentimento LGPD (implícito) do lead assim que ele é criado", async () => {
    await startDiagnostic({
      name: "Maria Souza",
      companyName: "CodeBit Tecnologia",
      website: "codebit.com.br",
      email: "maria@codebit.com.br",
      keywords: ["a", "b", "c", "d", "e"],
    });

    expect(recordConsent).toHaveBeenCalledWith("lead-1", expect.any(String));
  });

  it("aceita empresa sem site (website null)", async () => {
    const keywords = ["a", "b", "c", "d", "e"];

    await startDiagnostic({
      name: "Maria Souza",
      companyName: "Sem Site LTDA",
      email: "contato@semsite.com.br",
      keywords,
    });

    expect(findOrCreateCompany).toHaveBeenCalledWith({
      company_name: "Sem Site LTDA",
      website: null,
      keywords,
    });
  });

  it("registra o evento start_diagnostic com o diagnostic_id correto", async () => {
    await startDiagnostic({
      name: "Maria Souza",
      companyName: "CodeBit Tecnologia",
      website: "codebit.com.br",
      email: "maria@codebit.com.br",
      keywords: ["a", "b", "c", "d", "e"],
      utm: { source: "google" },
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnostic_id: "diagnostic-1",
        event_name: "start_diagnostic",
      }),
    );
  });

  it("propaga o erro quando a criação do diagnóstico falha, sem registrar o evento", async () => {
    createDiagnostic.mockRejectedValueOnce(new Error("falha de conexão"));

    await expect(
      startDiagnostic({
        name: "Maria Souza",
        companyName: "CodeBit",
        email: "maria@codebit.com.br",
        keywords: ["a", "b", "c", "d", "e"],
      }),
    ).rejects.toThrow("falha de conexão");

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
