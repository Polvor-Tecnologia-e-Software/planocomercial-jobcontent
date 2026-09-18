import { describe, expect, it } from "vitest";

import { groundFunnelIndicators } from "@/lib/ai/indicator-grounding";
import type { CommercialPlan, Indicator } from "@/schemas/commercial-plan";

function makeIndicator(overrides: Partial<Indicator> = {}): Indicator {
  return { name: "Indicador", currentValue: "1", targetValue: "1", frequency: "monthly", ...overrides };
}

function makePlan(indicators: Indicator[]): CommercialPlan {
  return {
    executiveDiagnosis: "x",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "x", source: "declared_answer" }],
    rootCause: { description: "x", evidence: [{ summary: "x", source: "declared_answer" }] },
    goalGapInterpretation: "x",
    priorities: [1, 2, 3].map((n) => ({
      title: `P${n}`,
      rationale: "x",
      problemSolved: "x",
      expectedImpact: "x",
      primaryIndicator: "x",
      timeframe: "30 dias",
    })),
    plan90Days: { days1to30: [], days31to60: [], days61to90: [] },
    weeklyManagerAgenda: [{ focus: "x", activities: ["x"] }],
    indicators,
    limitations: ["x"],
    consultativeCta: { message: "x" },
  };
}

describe("groundFunnelIndicators", () => {
  it("corrige a meta de um indicador de leads para o valor real de requiredFunnel.leads", () => {
    const plan = makePlan([makeIndicator({ name: "Leads novos por mês", targetValue: "999" })]);
    const result = groundFunnelIndicators(plan, { leads: 8 });
    expect(result.indicators[0].targetValue).toBe("8");
  });

  it("corrige a meta de um indicador de oportunidades", () => {
    const plan = makePlan([makeIndicator({ name: "Oportunidades geradas por mês", targetValue: "errado" })]);
    expect(groundFunnelIndicators(plan, { opportunities: 2 }).indicators[0].targetValue).toBe("2");
  });

  it("corrige a meta de um indicador de reuniões", () => {
    const plan = makePlan([makeIndicator({ name: "Reuniões agendadas por mês", targetValue: "errado" })]);
    expect(groundFunnelIndicators(plan, { meetings: 5 }).indicators[0].targetValue).toBe("5");
  });

  it("corrige a meta de um indicador de propostas", () => {
    const plan = makePlan([makeIndicator({ name: "Propostas enviadas por mês", targetValue: "errado" })]);
    expect(groundFunnelIndicators(plan, { proposals: 4 }).indicators[0].targetValue).toBe("4");
  });

  it("corrige a meta de um indicador de novos clientes fechados", () => {
    const plan = makePlan([makeIndicator({ name: "Número de novos clientes fechados", targetValue: "errado" })]);
    expect(groundFunnelIndicators(plan, { customers: 1 }).indicators[0].targetValue).toBe("1");
  });

  it("não altera um indicador sem relação com nenhum estágio do funil", () => {
    const plan = makePlan([makeIndicator({ name: "Satisfação do cliente", targetValue: "90%" })]);
    const result = groundFunnelIndicators(plan, { customers: 1 });
    expect(result.indicators[0].targetValue).toBe("90%");
  });

  it("não altera quando não há valor real para o estágio detectado (nada pra comparar)", () => {
    const plan = makePlan([makeIndicator({ name: "Leads novos por mês", targetValue: "8" })]);
    const result = groundFunnelIndicators(plan, {});
    expect(result.indicators[0].targetValue).toBe("8");
  });

  it("nunca toca em currentValue, só em targetValue", () => {
    const plan = makePlan([makeIndicator({ name: "Leads novos por mês", currentValue: "15", targetValue: "999" })]);
    const result = groundFunnelIndicators(plan, { leads: 8 });
    expect(result.indicators[0].currentValue).toBe("15");
  });

  it("corrige cada indicador de forma independente quando há vários", () => {
    const plan = makePlan([
      makeIndicator({ name: "Leads novos por mês", targetValue: "999" }),
      makeIndicator({ name: "Número de novos clientes fechados", targetValue: "999" }),
    ]);
    const result = groundFunnelIndicators(plan, { leads: 8, customers: 1 });
    expect(result.indicators[0].targetValue).toBe("8");
    expect(result.indicators[1].targetValue).toBe("1");
  });
});
