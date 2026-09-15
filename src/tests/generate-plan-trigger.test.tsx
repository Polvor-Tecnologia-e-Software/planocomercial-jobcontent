import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const generateCommercialPlanAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/server/actions/generate-commercial-plan-action", () => ({
  generateCommercialPlanAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const { GeneratePlanTrigger } = await import("@/components/result/generate-plan-trigger");

beforeEach(() => {
  generateCommercialPlanAction.mockReset();
  refresh.mockReset();
});

describe("GeneratePlanTrigger", () => {
  it("chama a action com o diagnosticId e atualiza a página em caso de sucesso", async () => {
    generateCommercialPlanAction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<GeneratePlanTrigger diagnosticId="diagnostic-1" label="Gerar meu plano comercial" />);
    await user.click(screen.getByRole("button", { name: "Gerar meu plano comercial" }));

    expect(generateCommercialPlanAction).toHaveBeenCalledWith("diagnostic-1");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("mostra uma mensagem de erro específica sem atualizar a página quando a action falha", async () => {
    generateCommercialPlanAction.mockResolvedValue({ ok: false, reason: "transport_error" });
    const user = userEvent.setup();

    render(<GeneratePlanTrigger diagnosticId="diagnostic-1" label="Tentar novamente" />);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/serviço de IA/);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("mostra mensagem específica quando o limite de tentativas foi atingido", async () => {
    generateCommercialPlanAction.mockResolvedValue({ ok: false, reason: "too_many_attempts" });
    const user = userEvent.setup();

    render(<GeneratePlanTrigger diagnosticId="diagnostic-1" label="Tentar novamente" />);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/limite de tentativas/);
  });

  it("desabilita o botão e mostra texto de carregamento enquanto pendente", async () => {
    let resolveAction: (value: { ok: true }) => void = () => {};
    generateCommercialPlanAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<GeneratePlanTrigger diagnosticId="diagnostic-1" label="Gerar meu plano comercial" />);
    await user.click(screen.getByRole("button", { name: "Gerar meu plano comercial" }));

    expect(screen.getByRole("button", { name: "Gerando seu plano..." })).toBeDisabled();

    resolveAction({ ok: true });
  });
});
