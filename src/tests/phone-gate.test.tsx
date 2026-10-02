import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const saveLeadPhoneAction = vi.fn();
const generateCommercialPlanAction = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/server/actions/save-lead-phone-action", () => ({ saveLeadPhoneAction }));
vi.mock("@/server/actions/generate-commercial-plan-action", () => ({ generateCommercialPlanAction }));

const { PhoneGate } = await import("@/components/result/phone-gate");

beforeEach(() => {
  vi.clearAllMocks();
  saveLeadPhoneAction.mockResolvedValue({ ok: true });
  generateCommercialPlanAction.mockResolvedValue({ ok: true });
});

describe("PhoneGate", () => {
  it("pede o telefone com um CTA grande antes de liberar o diagnóstico", () => {
    render(<PhoneGate diagnosticId="diagnostic-1" companyName="CodeBit" needsGeneration />);
    expect(screen.getByText("Seu diagnóstico + plano está quase pronto, CodeBit")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone / WhatsApp")).toBeRequired();
    expect(screen.getByRole("button", { name: "Ver meu diagnóstico completo" })).toBeInTheDocument();
  });

  it("aplica a máscara enquanto a pessoa digita", async () => {
    const user = userEvent.setup();
    render(<PhoneGate diagnosticId="diagnostic-1" companyName="CodeBit" needsGeneration />);
    const field = screen.getByLabelText("Telefone / WhatsApp");
    await user.type(field, "11987654321");
    expect(field).toHaveValue("(11) 98765-4321");
  });

  it("grava o telefone, gera o plano e recarrega a página quando o plano ainda não existe", async () => {
    const user = userEvent.setup();
    render(<PhoneGate diagnosticId="diagnostic-1" companyName="CodeBit" needsGeneration />);
    await user.type(screen.getByLabelText("Telefone / WhatsApp"), "11987654321");
    await user.click(screen.getByRole("button", { name: "Ver meu diagnóstico completo" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(saveLeadPhoneAction).toHaveBeenCalledWith("diagnostic-1", "(11) 98765-4321");
    expect(generateCommercialPlanAction).toHaveBeenCalledWith("diagnostic-1");
  });

  it("só grava e recarrega (sem gerar de novo) quando o plano já existe", async () => {
    const user = userEvent.setup();
    render(<PhoneGate diagnosticId="diagnostic-1" companyName="CodeBit" needsGeneration={false} />);
    await user.type(screen.getByLabelText("Telefone / WhatsApp"), "11987654321");
    await user.click(screen.getByRole("button", { name: "Ver meu diagnóstico completo" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(generateCommercialPlanAction).not.toHaveBeenCalled();
  });

  it("mostra o erro de validação e não avança quando o telefone é inválido", async () => {
    saveLeadPhoneAction.mockResolvedValue({ ok: false, fieldError: "Informe um telefone válido com DDD." });
    const user = userEvent.setup();
    render(<PhoneGate diagnosticId="diagnostic-1" companyName="CodeBit" needsGeneration />);
    await user.type(screen.getByLabelText("Telefone / WhatsApp"), "119");
    await user.click(screen.getByRole("button", { name: "Ver meu diagnóstico completo" }));

    expect(await screen.findByText("Informe um telefone válido com DDD.")).toBeInTheDocument();
    expect(generateCommercialPlanAction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
