import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Plan90DaysSection } from "@/components/result/plan-90-days-section";
import type {
  CommercialPlan90Days,
  PlanAction,
  PlanPhaseSummaries,
  StrategicSummary,
} from "@/schemas/commercial-plan";

function makeAction(overrides: Partial<PlanAction> = {}): PlanAction {
  return {
    title: "Ação",
    objective: "Objetivo",
    actionType: "sales_process",
    details: ["Detalhe 1", "Detalhe 2"],
    blogBrief: null,
    richMaterialBrief: null,
    paidTrafficBrief: null,
    cadenceBrief: null,
    landingPageBrief: null,
    playbookBrief: null,
    suggestedOwner: "Vendas",
    deadline: "Semana 1",
    indicator: "Indicador",
    completionCriteria: "Critério",
    relatedPriority: 1,
    ...overrides,
  };
}

function makePlan(): CommercialPlan90Days {
  return {
    days1to30: [makeAction({ relatedPriority: 1 })],
    days31to60: [makeAction({ relatedPriority: 2 })],
    days61to90: [makeAction({ relatedPriority: 3 })],
  };
}

const STRATEGIC_SUMMARY: StrategicSummary = {
  headline: "Meta do trimestre.",
  positioning: "Posicionamento.",
  channelStrategy: "Estratégia de canais.",
  contentJourney: "Jornada de conteúdo.",
  mediaBudgetPriority: [
    { channel: "Google", priority: "alta" },
    { channel: "Meta", priority: "baixa" },
  ],
  commercialProcess: "Processo comercial.",
  premises: "Premissas.",
};

const PHASE_SUMMARIES: PlanPhaseSummaries = {
  days1to30: { goal: "Meta do mês 1.", milestone: "Marco do mês 1." },
  days31to60: { goal: "Meta do mês 2.", milestone: "Marco do mês 2." },
  days61to90: { goal: "Meta do mês 3.", milestone: "Marco do mês 3." },
};

/**
 * Plan90DaysSection só compõe (resumo estratégico + cronograma + abas de
 * mês) — o conteúdo detalhado de cada brief é testado em
 * plan-strategic-summary.test.tsx, plan-cronograma.test.tsx e
 * plan-month-detail.test.tsx. Aqui só confirmamos que as três peças
 * aparecem juntas com os dados certos.
 */
describe("Plan90DaysSection — composição", () => {
  it("mostra o resumo estratégico, o cronograma das frentes e o detalhamento mês a mês", () => {
    render(
      <Plan90DaysSection
        plan={makePlan()}
        strategicSummary={STRATEGIC_SUMMARY}
        phaseSummaries={PHASE_SUMMARIES}
        companyName="CodeBit"
        companyWebsite="codebit.com.br"
      />,
    );

    expect(screen.getByText("Meta do trimestre.")).toBeInTheDocument();
    expect(screen.getByText("Cronograma das frentes")).toBeInTheDocument();
    expect(screen.getByText("Ações práticas mês a mês")).toBeInTheDocument();
  });
});
