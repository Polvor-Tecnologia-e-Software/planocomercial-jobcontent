import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCommercialPlanPdfAction = vi.fn();
const windowOpen = vi.fn();

vi.mock("@/server/actions/get-commercial-plan-pdf-action", () => ({
  getCommercialPlanPdfAction,
}));

const { DownloadPdfButton } = await import("@/components/result/download-pdf-button");

beforeEach(() => {
  getCommercialPlanPdfAction.mockReset();
  windowOpen.mockReset();
  vi.stubGlobal("open", windowOpen);
});

describe("DownloadPdfButton", () => {
  it("chama a action e abre a signed URL numa nova aba quando pronto", async () => {
    getCommercialPlanPdfAction.mockResolvedValue({ ok: true, url: "https://storage.example/signed" });
    const user = userEvent.setup();

    render(<DownloadPdfButton diagnosticId="diagnostic-1" />);
    await user.click(screen.getByRole("button", { name: "Baixar plano em PDF" }));

    expect(getCommercialPlanPdfAction).toHaveBeenCalledWith("diagnostic-1");
    expect(windowOpen).toHaveBeenCalledWith("https://storage.example/signed", "_blank", "noopener,noreferrer");
  });

  it("mostra mensagem de erro específica sem abrir nenhuma URL quando falha", async () => {
    getCommercialPlanPdfAction.mockResolvedValue({ ok: false, reason: "upload_failed" });
    const user = userEvent.setup();

    render(<DownloadPdfButton diagnosticId="diagnostic-1" />);
    await user.click(screen.getByRole("button", { name: "Baixar plano em PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Não conseguimos salvar o PDF/);
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it("mostra mensagem específica quando o plano ainda não foi gerado", async () => {
    getCommercialPlanPdfAction.mockResolvedValue({ ok: false, reason: "plan_not_ready" });
    const user = userEvent.setup();

    render(<DownloadPdfButton diagnosticId="diagnostic-1" />);
    await user.click(screen.getByRole("button", { name: "Baixar plano em PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/gere o plano antes/);
  });

  it("desabilita o botão enquanto pendente", async () => {
    let resolveAction: (value: { ok: true; url: string }) => void = () => {};
    getCommercialPlanPdfAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<DownloadPdfButton diagnosticId="diagnostic-1" />);
    await user.click(screen.getByRole("button", { name: "Baixar plano em PDF" }));

    expect(screen.getByRole("button", { name: "Gerando PDF..." })).toBeDisabled();

    resolveAction({ ok: true, url: "https://storage.example/signed" });
  });
});
