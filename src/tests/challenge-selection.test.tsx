import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectChallengeAction = vi.fn().mockResolvedValue(undefined);

vi.mock("@/server/actions/select-challenge-action", () => ({
  selectChallengeAction,
}));

const { ChallengeSelection } = await import(
  "@/components/diagnostic/challenge-selection"
);

beforeEach(() => {
  selectChallengeAction.mockClear();
});

describe("ChallengeSelection", () => {
  it("exibe o título da tela e os 6 cartões de desafio", () => {
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    expect(
      screen.getByText("Qual problema mais limita seu crescimento hoje?"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByText("Precisamos gerar mais oportunidades")).toBeInTheDocument();
    expect(screen.getByText("Geramos leads, mas poucos avançam")).toBeInTheDocument();
    expect(screen.getByText("Temos propostas, mas fechamos pouco")).toBeInTheDocument();
    expect(
      screen.getByText("O processo depende demais dos vendedores"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Não sabemos onde estamos perdendo vendas"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Queremos crescer sem aumentar a equipe"),
    ).toBeInTheDocument();
  });

  it("só o primeiro cartão é alcançável por Tab inicialmente (roving tabindex)", () => {
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    for (const radio of radios.slice(1)) {
      expect(radio).toHaveAttribute("tabindex", "-1");
    }
  });

  it("move o foco entre cartões com as setas do teclado", async () => {
    const user = userEvent.setup();
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    const radios = screen.getAllByRole("radio");
    radios[0].focus();

    await user.keyboard("{ArrowRight}");
    expect(radios[1]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(radios[2]).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(radios[1]).toHaveFocus();

    await user.keyboard("{End}");
    expect(radios[5]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(radios[0]).toHaveFocus();
  });

  it("Enter no cartão focado seleciona e envia o desafio correto", async () => {
    const user = userEvent.setup();
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    const radios = screen.getAllByRole("radio");
    radios[0].focus();
    await user.keyboard("{ArrowRight}{ArrowRight}"); // D1 -> D2 -> D3
    await user.keyboard("{Enter}");

    expect(radios[2]).toHaveAttribute("aria-checked", "true");
    expect(selectChallengeAction).toHaveBeenCalledTimes(1);
    const submittedFormData = selectChallengeAction.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("diagnosticId")).toBe("diagnostic-1");
    expect(submittedFormData.get("selectedChallenge")).toBe("D3");
  });

  it("clicar num cartão também seleciona e envia (sem precisar de teclado)", async () => {
    const user = userEvent.setup();
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    await user.click(screen.getByText("Queremos crescer sem aumentar a equipe"));

    expect(selectChallengeAction).toHaveBeenCalledTimes(1);
    const submittedFormData = selectChallengeAction.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("selectedChallenge")).toBe("D6");
  });

  it("cada cartão tem um estado selecionado exposto via aria-checked", () => {
    render(<ChallengeSelection diagnosticId="diagnostic-1" />);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("aria-checked", "false");
    }
  });
});
