import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("utm_source=google&utm_medium=cpc"),
}));

vi.mock("@/server/actions/start-diagnostic-action", () => ({
  startDiagnosticAction: vi.fn(async () => ({ status: "idle" })),
}));

vi.mock("@/server/actions/start-diagnostic-initial-state", () => ({
  initialStartDiagnosticState: { status: "idle" },
}));

const { CaptureForm } = await import("@/components/diagnostic/capture-form");

describe("CaptureForm", () => {
  it("exibe os cinco campos da primeira captura", () => {
    render(<CaptureForm />);

    expect(screen.getByLabelText("Seu nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome da empresa")).toBeInTheDocument();
    expect(screen.getByLabelText(/Site da empresa/)).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail corporativo")).toBeInTheDocument();
    expect(screen.getByLabelText("Palavras-chave do negócio")).toBeInTheDocument();
  });

  it("marca nome, empresa, e-mail e palavras-chave como obrigatórios (site é opcional)", () => {
    render(<CaptureForm />);

    expect(screen.getByLabelText("Seu nome")).toBeRequired();
    expect(screen.getByLabelText("Nome da empresa")).toBeRequired();
    expect(screen.getByLabelText("E-mail corporativo")).toBeRequired();
    expect(screen.getByLabelText("Palavras-chave do negócio")).toBeRequired();
    expect(screen.getByLabelText(/Site da empresa/)).not.toBeRequired();
  });

  it("explica quantas palavras-chave informar", () => {
    render(<CaptureForm />);
    expect(screen.getByText(/5 a 10 palavras/)).toBeInTheDocument();
  });

  it("explica que é possível continuar sem informar o site", () => {
    render(<CaptureForm />);

    expect(screen.getByText(/Não tem site\? Sem problema/i)).toBeInTheDocument();
  });

  it("propaga os UTMs da URL como campos ocultos", () => {
    const { container } = render(<CaptureForm />);

    const utmSource = container.querySelector('input[name="utm_source"]');
    const utmMedium = container.querySelector('input[name="utm_medium"]');

    expect(utmSource).toHaveValue("google");
    expect(utmMedium).toHaveValue("cpc");
  });

  it("exibe o botão de continuar", () => {
    render(<CaptureForm />);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });
});
