import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server/actions/generate-commercial-plan-action", () => ({
  generateCommercialPlanAction: vi.fn(),
}));

vi.mock("@/server/actions/get-commercial-plan-pdf-action", () => ({
  getCommercialPlanPdfAction: vi.fn(),
}));

const { ResultPage } = await import("@/components/result/result-page");

function validPlan(overrides: Record<string, unknown> = {}) {
  return {
    executiveDiagnosis: "A empresa perde oportunidades por falta de critério de qualificação de leads.",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "Evidência principal.", source: "declared_answer" }],
    rootCause: {
      description: "Critério de qualificação existe mas não é seguido.",
      evidence: [
        { summary: "Baixa geração de oportunidades", source: "deterministic_calculation" },
        { summary: "Dependência de indicação", source: "declared_answer" },
      ],
    },
    goalGapInterpretation: "O gap está concentrado na etapa de qualificação.",
    priorities: [1, 2, 3].map((n) => ({
      title: `Prioridade ${n}`,
      rationale: "Motivo",
      problemSolved: "Problema",
      expectedImpact: "Impacto",
      primaryIndicator: "Indicador",
      timeframe: "30 dias",
    })),
    plan90Days: {
      days1to30: [
        {
          title: "Formalizar critério MQL",
          objective: "Objetivo",
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          suggestedOwner: "Marketing",
          deadline: "Semana 2",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 1,
        },
      ],
      days31to60: [
        {
          title: "Ação fase 2",
          objective: "Objetivo",
          actionType: "content_blog",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          suggestedOwner: "Vendas",
          deadline: "Semana 6",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 2,
        },
      ],
      days61to90: [
        {
          title: "Ação fase 3",
          objective: "Objetivo",
          actionType: "paid_traffic",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          suggestedOwner: "Vendas",
          deadline: "Semana 10",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 3,
        },
      ],
    },
    weeklyManagerAgenda: [
      { focus: "Revisão de pipeline", activities: ["Revisar oportunidades paradas"] },
      { focus: "1:1 com vendedores", activities: ["Checar bloqueios"] },
      { focus: "Análise semanal", activities: ["Revisar indicadores"] },
    ],
    indicators: [{ name: "Taxa de conversão", currentValue: "20%", targetValue: "35%", frequency: "weekly" }],
    limitations: ["Qualidade de dados média."],
    consultativeCta: { message: "Vamos conversar?" },
    ...overrides,
  };
}

const CALCULABLE_STAGE = {
  key: "leads" as const,
  label: "Leads",
  current: 100,
  required: 500,
  gap: 400,
  ratePercent: null,
  rateLabel: null,
  uncalculable: false,
};

const UNCALCULABLE_STAGE = {
  key: "customers" as const,
  label: "Vendas",
  current: null,
  required: null,
  gap: null,
  ratePercent: null,
  rateLabel: null,
  uncalculable: true,
};

function completedState(overrides: Record<string, unknown> = {}) {
  return {
    status: "completed" as const,
    diagnosticId: "diagnostic-1",
    companyName: "CodeBit",
    generatedAt: "2026-01-05T00:00:00.000Z",
    plan: validPlan(),
    funnelStages: [CALCULABLE_STAGE, UNCALCULABLE_STAGE],
    primaryBottleneck: "conversion" as const,
    secondaryRisk: null,
    dataQualityPercentage: 60,
    confidence: "medium" as const,
    seoOpportunities: [],
    ...overrides,
  };
}

describe("ResultPage — relatório completo", () => {
  it("mostra o diagnóstico executivo, as 3 prioridades e as 3 fases do plano", () => {
    render(<ResultPage state={completedState()} />);

    expect(
      screen.getByText(/perde oportunidades por falta de critério de qualificação/),
    ).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("Formalizar critério MQL")).toBeInTheDocument();
  });

  it("mostra a mensagem de fallback para um estágio do funil não calculável, sem inventar número", () => {
    render(<ResultPage state={completedState()} />);
    expect(
      screen.getByText("Não foi possível calcular esta etapa com os dados disponíveis."),
    ).toBeInTheDocument();
  });

  it("mostra a agenda semanal com os rótulos Segunda/Quarta/Sexta", () => {
    render(<ResultPage state={completedState()} />);
    expect(screen.getByText("Segunda")).toBeInTheDocument();
    expect(screen.getByText("Quarta")).toBeInTheDocument();
    expect(screen.getByText("Sexta")).toBeInTheDocument();
  });

  it("renderiza textos grandes sem quebrar", () => {
    const longText = "Detalhe adicional sobre o diagnóstico executivo. ".repeat(10).trim();
    render(<ResultPage state={completedState({ plan: validPlan({ executiveDiagnosis: longText }) })} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("deixa claro que os números do funil vêm das respostas da pessoa, nunca de uma média de mercado", () => {
    render(<ResultPage state={completedState()} />);
    expect(screen.getByText(/nunca de uma média de mercado/)).toBeInTheDocument();
  });

  it("explica que 'Necessário' menor que 'Atual' significa conversão eficiente, não uma etapa não calculável", () => {
    render(
      <ResultPage
        state={completedState({
          funnelStages: [
            { ...CALCULABLE_STAGE, current: 100, required: 20, gap: 0 },
            UNCALCULABLE_STAGE,
          ],
        })}
      />,
    );
    expect(screen.getByText(/o gargalo real está em outra etapa do funil/)).toBeInTheDocument();
  });

  it("NÃO mostra a explicação de 'necessário menor' quando nenhuma etapa está nessa situação", () => {
    render(<ResultPage state={completedState()} />);
    expect(screen.queryByText(/o gargalo real está em outra etapa do funil/)).not.toBeInTheDocument();
  });
});

describe("ResultPage — Oportunidades para a sua empresa (SEO) condicional", () => {
  it("não mostra a seção de SEO quando não há nenhuma oportunidade (sem palavras-chave, ou falha da IA)", () => {
    render(<ResultPage state={completedState({ seoOpportunities: [] })} />);
    expect(screen.queryByText("Oportunidades para a sua empresa")).not.toBeInTheDocument();
  });

  it("mostra a seção de SEO com as palavras-chave quando existem oportunidades", () => {
    render(
      <ResultPage
        state={completedState({
          seoOpportunities: [
            {
              keyword: "consultoria financeira",
              avgMonthlySearches: 1000,
              competition: "low",
              opportunityRank: 1,
              coverageGap: false,
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Oportunidades para a sua empresa")).toBeInTheDocument();
    expect(screen.getByText("consultoria financeira")).toBeInTheDocument();
  });
});

describe("ResultPage — outros estados", () => {
  it("not_generated: mostra o convite para gerar o plano", () => {
    render(
      <ResultPage
        state={{ status: "not_generated", diagnosticId: "diagnostic-1", companyName: "CodeBit" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Gerar meu plano comercial" })).toBeInTheDocument();
  });

  it("generating: mostra o estado de espera, sem botão de ação", () => {
    render(<ResultPage state={{ status: "generating", diagnosticId: "diagnostic-1", companyName: "CodeBit" }} />);
    expect(screen.getByText(/Gerando o plano de CodeBit/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("failed com canRetry: mostra o botão de tentar de novo", () => {
    render(
      <ResultPage
        state={{
          status: "failed",
          diagnosticId: "diagnostic-1",
          companyName: "CodeBit",
          reason: "transport_error",
          canRetry: true,
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("acesso inválido: not_found aciona notFound() do Next.js", () => {
    expect(() => render(<ResultPage state={{ status: "not_found" }} />)).toThrow("NEXT_NOT_FOUND");
  });
});
