import { beforeEach, describe, expect, it, vi } from "vitest";

const getDiagnosticById = vi.fn();
const updateLead = vi.fn();

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById },
  leads: { updateLead },
}));

const { saveLeadPhone } = await import("@/server/save-lead-phone");

beforeEach(() => {
  vi.clearAllMocks();
  updateLead.mockResolvedValue({ id: "lead-1" });
});

describe("saveLeadPhone", () => {
  it("grava o telefone no lead do diagnóstico, com o consentimento de contato por telefone", async () => {
    getDiagnosticById.mockResolvedValue({ id: "diagnostic-1", lead_id: "lead-1" });

    const result = await saveLeadPhone("diagnostic-1", "(11) 98765-4321");

    expect(result).toEqual({ status: "saved" });
    expect(updateLead).toHaveBeenCalledWith("lead-1", {
      phone: "(11) 98765-4321",
      consent_given: true,
      consent_version: "phone-gate-implicit-v1",
    });
  });

  it("não grava nada quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);
    expect(await saveLeadPhone("x", "(11) 98765-4321")).toEqual({
      status: "skipped",
      reason: "diagnostic_not_found",
    });
    expect(updateLead).not.toHaveBeenCalled();
  });

  it("não grava nada quando o diagnóstico não tem lead", async () => {
    getDiagnosticById.mockResolvedValue({ id: "diagnostic-1", lead_id: null });
    expect(await saveLeadPhone("diagnostic-1", "(11) 98765-4321")).toEqual({
      status: "skipped",
      reason: "no_lead",
    });
    expect(updateLead).not.toHaveBeenCalled();
  });
});
