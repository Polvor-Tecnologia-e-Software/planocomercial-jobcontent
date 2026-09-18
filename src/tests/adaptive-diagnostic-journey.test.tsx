import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const answerDiagnosticQuestionAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/server/actions/answer-diagnostic-question-action", () => ({
  answerDiagnosticQuestionAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const { AdaptiveDiagnosticJourney } = await import(
  "@/components/diagnostic/adaptive-diagnostic-journey"
);

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function fakeAnswerRow(questionKey: string, answerValue: string | number) {
  return {
    id: `answer-${questionKey}`,
    diagnostic_id: "diagnostic-1",
    question_key: questionKey,
    answer_value: answerValue,
    answer_source: "user" as const,
    confirmed: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  answerDiagnosticQuestionAction.mockReset();
  refresh.mockReset();
});

describe("AdaptiveDiagnosticJourney", () => {
  it("mostra a primeira pergunta universal quando não há nenhuma resposta ainda", () => {
    render(
      <AdaptiveDiagnosticJourney diagnosticId="diagnostic-1" challenge="D1" initialAnswers={[]} />,
    );

    expect(
      screen.getByText(
        "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
  });

  it("retoma a partir da primeira pergunta ainda sem resposta", () => {
    render(
      <AdaptiveDiagnosticJourney
        diagnosticId="diagnostic-1"
        challenge="D1"
        initialAnswers={[fakeAnswerRow("U1", 1000)]}
      />,
    );

    expect(
      screen.getByText("Qual é o ciclo médio de vendas, da primeira conversa ao fechamento (em dias)?"),
    ).toBeInTheDocument();
  });

  it("envia a resposta em reais (sem símbolo/formatação) e avança para a próxima pergunta ao ter sucesso", async () => {
    answerDiagnosticQuestionAction.mockResolvedValue({
      status: "saved",
      diagnostic: { id: "diagnostic-1" },
      isComplete: false,
      value: 5000,
    });
    const user = userEvent.setup();

    render(
      <AdaptiveDiagnosticJourney diagnosticId="diagnostic-1" challenge="D1" initialAnswers={[]} />,
    );

    const currencyField = screen.getByRole("textbox", {
      name: "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
    });
    await user.type(currencyField, "5000");

    expect(currencyField).toHaveValue(BRL_FORMATTER.format(5000));

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(answerDiagnosticQuestionAction).toHaveBeenCalledWith("diagnostic-1", "U1", "5000");
    expect(
      await screen.findByText(
        "Qual é o ciclo médio de vendas, da primeira conversa ao fechamento (em dias)?",
      ),
    ).toBeInTheDocument();
  });

  it("seleção única envia e avança assim que uma opção é clicada, sem precisar de um botão continuar", async () => {
    answerDiagnosticQuestionAction.mockResolvedValue({
      status: "saved",
      diagnostic: { id: "diagnostic-1" },
      isComplete: false,
      value: "nao_sei",
    });
    const user = userEvent.setup();

    render(
      <AdaptiveDiagnosticJourney
        diagnosticId="diagnostic-1"
        challenge="D1"
        initialAnswers={[
          fakeAnswerRow("U1", 1000),
          fakeAnswerRow("U2", 30),
          fakeAnswerRow("U3", 2),
          fakeAnswerRow("U4", 100_000),
          fakeAnswerRow("U5", 12),
          fakeAnswerRow("U10", 60_000),
          fakeAnswerRow("U6", 50),
          fakeAnswerRow("U7", 20),
          fakeAnswerRow("U8", 15),
          fakeAnswerRow("U9", 10),
          fakeAnswerRow("U11", "usa_estruturado"),
        ]}
      />,
    );

    expect(screen.getByText("De onde vêm a maioria dos leads hoje?")).toBeInTheDocument();
    await user.click(screen.getByText("Não sei dizer"));

    expect(answerDiagnosticQuestionAction).toHaveBeenCalledWith("diagnostic-1", "D1_Q1", "nao_sei");
    // D1_Q3 só entra na rota quando D1_Q1 === "nao_sei" (displayRule) — confirma que a próxima pergunta certa aparece.
    expect(
      await screen.findByText("Existe algum registro (CRM ou planilha) de onde os leads vêm?"),
    ).toBeInTheDocument();
  });

  it("mostra uma mensagem de erro quando o servidor rejeita a resposta, sem avançar", async () => {
    answerDiagnosticQuestionAction.mockResolvedValue({
      status: "error",
      reason: "invalid_value",
    });
    const user = userEvent.setup();

    render(
      <AdaptiveDiagnosticJourney diagnosticId="diagnostic-1" challenge="D1" initialAnswers={[]} />,
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
      }),
      "1",
    );
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Essa resposta não é válida");
    expect(
      screen.getByText(
        "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
      ),
    ).toBeInTheDocument();
  });

  it("volta para a pergunta anterior e recarrega a resposta já dada para edição", async () => {
    const user = userEvent.setup();

    render(
      <AdaptiveDiagnosticJourney
        diagnosticId="diagnostic-1"
        challenge="D1"
        initialAnswers={[fakeAnswerRow("U1", 1000)]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(
      screen.getByText(
        "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
      }),
    ).toHaveValue(BRL_FORMATTER.format(1000));
  });

  it("chama router.refresh() ao concluir a última pergunta aplicável", async () => {
    answerDiagnosticQuestionAction.mockResolvedValue({
      status: "saved",
      diagnostic: { id: "diagnostic-1" },
      isComplete: true,
      value: "qualquer_um",
    });
    const user = userEvent.setup();

    render(
      <AdaptiveDiagnosticJourney
        diagnosticId="diagnostic-1"
        challenge="D5"
        initialAnswers={[
          fakeAnswerRow("U1", 1000),
          fakeAnswerRow("U2", 30),
          fakeAnswerRow("U3", 2),
          fakeAnswerRow("U4", 100_000),
          fakeAnswerRow("U5", 12),
          fakeAnswerRow("U10", 60_000),
          fakeAnswerRow("U6", 50),
          fakeAnswerRow("U7", 20),
          fakeAnswerRow("U8", 15),
          fakeAnswerRow("U9", 10),
          fakeAnswerRow("U11", "usa_estruturado"),
          fakeAnswerRow("D5_Q1", "sim_atualizado"),
        ]}
      />,
    );

    await user.click(screen.getByText("Qualquer um do time"));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
