import { describe, expect, it } from "vitest";

import { buildPlanFronts, PLAN_MONTHS } from "@/lib/plan-timeline";
import type { ActionType, CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

function makeAction(actionType: ActionType, overrides: Partial<PlanAction> = {}): PlanAction {
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
    ...overrides,
  };
}

function makePlan90Days(overrides: Partial<CommercialPlan90Days> = {}): CommercialPlan90Days {
  return {
    days1to30: [makeAction("sales_process")],
    days31to60: [makeAction("sales_process")],
    days61to90: [makeAction("sales_process")],
    ...overrides,
  };
}

describe("buildPlanFronts", () => {
  it("inclui só os actionTypes que aparecem em pelo menos uma ação do plano", () => {
    const fronts = buildPlanFronts(makePlan90Days());
    expect(fronts).toHaveLength(1);
    expect(fronts[0].actionType).toBe("sales_process");
  });

  it("sempre devolve 3 células por frente, alinhadas com PLAN_MONTHS", () => {
    const fronts = buildPlanFronts(makePlan90Days());
    expect(fronts[0].cells).toHaveLength(PLAN_MONTHS.length);
  });

  it("agrupa as ações de uma frente na célula do mês correto, preservando a ordem do plano", () => {
    const blog1 = makeAction("content_blog", { title: "Post A" });
    const blog2 = makeAction("content_blog", { title: "Post B" });
    const plan = makePlan90Days({
      days1to30: [blog1, blog2, makeAction("sales_process")],
      days31to60: [],
      days61to90: [makeAction("content_blog", { title: "Post C" })],
    });
    const fronts = buildPlanFronts(plan);
    const blogFront = fronts.find((f) => f.actionType === "content_blog");
    expect(blogFront).toBeDefined();
    expect(blogFront!.cells[0].actions.map((a) => a.title)).toEqual(["Post A", "Post B"]);
    expect(blogFront!.cells[1].actions).toEqual([]);
    expect(blogFront!.cells[2].actions.map((a) => a.title)).toEqual(["Post C"]);
  });

  it("segue sempre a mesma ordem de frentes (ordem do ActionTypeSchema), não a ordem de aparição no plano", () => {
    const plan = makePlan90Days({
      days1to30: [makeAction("paid_traffic"), makeAction("content_blog")],
      days31to60: [],
      days61to90: [],
    });
    const fronts = buildPlanFronts(plan);
    expect(fronts.map((f) => f.actionType)).toEqual(["content_blog", "paid_traffic"]);
  });

  it("nunca inclui uma frente sem nenhuma ação em qualquer fase", () => {
    const fronts = buildPlanFronts(makePlan90Days());
    expect(fronts.some((f) => f.actionType === "landing_page")).toBe(false);
    expect(fronts.some((f) => f.actionType === "rich_material")).toBe(false);
  });

  it("usa o rótulo e a cor centralizados em plan-action-types.ts", () => {
    const fronts = buildPlanFronts(makePlan90Days());
    expect(fronts[0].label).toBe("Processo de vendas");
    expect(fronts[0].color).toBe("#B45309");
  });
});
