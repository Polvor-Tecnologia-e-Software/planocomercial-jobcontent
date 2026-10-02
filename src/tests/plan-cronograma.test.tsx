import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanCronograma } from "@/components/result/plan-cronograma";
import { buildPlanFronts } from "@/lib/plan-timeline";
import type { ActionType, CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

function makeAction(actionType: ActionType): PlanAction {
  return {
    title: "Ação",
    objective: "Objetivo",
    actionType,
    details: ["Detalhe 1", "Detalhe 2"],
    blogBrief: null,
    richMaterialBrief: null,
    paidTrafficBrief: null,
    cadenceBrief: null,
    landingPageBrief: null,
    playbookBrief: null,
    suggestedOwner: "Marketing",
    deadline: "Semana 1",
    indicator: "Indicador",
    completionCriteria: "Critério",
    relatedPriority: 1,
  };
}

describe("PlanCronograma", () => {
  it("não renderiza nada quando não há nenhuma frente (plano vazio)", () => {
    const { container } = render(<PlanCronograma fronts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra uma linha por frente com a contagem de ações de cada mês", () => {
    const plan: CommercialPlan90Days = {
      days1to30: [makeAction("content_blog"), makeAction("content_blog")],
      days31to60: [makeAction("content_blog")],
      days61to90: [],
    };
    render(<PlanCronograma fronts={buildPlanFronts(plan)} />);

    expect(screen.getByText("Conteúdo / Blog")).toBeInTheDocument();
    expect(screen.getByText("2 ações")).toBeInTheDocument();
    expect(screen.getByText("1 ação")).toBeInTheDocument();
  });

  it("mostra a legenda com o nome de cada mês", () => {
    const plan: CommercialPlan90Days = {
      days1to30: [makeAction("seo")],
      days31to60: [],
      days61to90: [],
    };
    render(<PlanCronograma fronts={buildPlanFronts(plan)} />);

    expect(screen.getByText("Estruturar a base")).toBeInTheDocument();
    expect(screen.getByText("Ativar a demanda")).toBeInTheDocument();
    expect(screen.getByText("Escalar e otimizar")).toBeInTheDocument();
  });

  it("mostra as 12 colunas de semana (S1-S12), igual ao layout de referência — granularidade visual, não um dado novo por semana", () => {
    const plan: CommercialPlan90Days = {
      days1to30: [makeAction("seo")],
      days31to60: [],
      days61to90: [],
    };
    render(<PlanCronograma fronts={buildPlanFronts(plan)} />);

    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("S6")).toBeInTheDocument();
    expect(screen.getByText("S12")).toBeInTheDocument();
  });
});
