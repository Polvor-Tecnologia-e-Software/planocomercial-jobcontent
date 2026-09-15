import { describe, expect, it } from "vitest";

import { CommercialPlanSchema, PlanActionSchema, PrioritySchema } from "@/schemas/commercial-plan";

function validAction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Padronizar critério de qualificação",
    objective: "Definir MQL claro para o time",
    suggestedOwner: "Marketing",
    deadline: "Semana 2",
    indicator: "% de leads qualificados",
    completionCriteria: "Critério documentado e aplicado por 2 semanas seguidas",
    relatedPriority: 1,
    ...overrides,
  };
}

function validPriority(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Padronizar qualificação de leads",
    rationale: "Sem critério claro, o time perde tempo com leads sem perfil",
    problemSolved: "Falta de critério de qualificação (MQL)",
    expectedImpact: "Aumento da taxa de conversão lead->oportunidade",
    primaryIndicator: "Taxa de conversão lead->oportunidade",
    timeframe: "30 dias",
    ...overrides,
  };
}

function validPlan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    executiveDiagnosis: "A empresa perde oportunidades por falta de critério de qualificação de leads.",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "42% dos leads não têm critério de qualificação aplicado", source: "declared_answer" }],
    rootCause: {
      description: "Ausência de critério MQL formal",
      evidence: [{ summary: "Resposta declarada: sem critério de qualificação", source: "declared_answer" }],
    },
    goalGapInterpretation: "O gap para a meta está concentrado na etapa de qualificação, não de geração de leads.",
    priorities: [validPriority({ title: "P1" }), validPriority({ title: "P2" }), validPriority({ title: "P3" })],
    plan90Days: {
      days1to30: [validAction()],
      days31to60: [validAction()],
      days61to90: [validAction()],
    },
    weeklyManagerAgenda: [{ focus: "Revisão de pipeline", activities: ["Revisar oportunidades paradas"] }],
    indicators: [{ name: "Taxa de conversão", currentValue: "20%", targetValue: "35%", frequency: "weekly" }],
    limitations: ["Qualidade de dados média — algumas respostas foram 'não sei'."],
    consultativeCta: { message: "Vamos aprofundar esse diagnóstico numa conversa com nosso time?" },
    ...overrides,
  };
}

describe("CommercialPlanSchema — exatamente 3 prioridades", () => {
  it("aceita exatamente 3 prioridades", () => {
    expect(CommercialPlanSchema.safeParse(validPlan()).success).toBe(true);
  });

  it("rejeita 2 prioridades", () => {
    const plan = validPlan({ priorities: [validPriority(), validPriority()] });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejeita 4 prioridades", () => {
    const plan = validPlan({
      priorities: [validPriority(), validPriority(), validPriority(), validPriority()],
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejeita 5 prioridades", () => {
    const plan = validPlan({
      priorities: Array.from({ length: 5 }, () => validPriority()),
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });
});

describe("CommercialPlanSchema — no máximo 5 ações por fase", () => {
  it("aceita 5 ações numa fase", () => {
    const plan = validPlan({
      plan90Days: {
        days1to30: Array.from({ length: 5 }, () => validAction()),
        days31to60: [validAction()],
        days61to90: [validAction()],
      },
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("rejeita 6 ações numa fase", () => {
    const plan = validPlan({
      plan90Days: {
        days1to30: Array.from({ length: 6 }, () => validAction()),
        days31to60: [validAction()],
        days61to90: [validAction()],
      },
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejeita uma fase vazia (mínimo 1 ação)", () => {
    const plan = validPlan({
      plan90Days: { days1to30: [], days31to60: [validAction()], days61to90: [validAction()] },
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejeita relatedPriority fora do intervalo 1-3", () => {
    expect(PlanActionSchema.safeParse(validAction({ relatedPriority: 4 })).success).toBe(false);
    expect(PlanActionSchema.safeParse(validAction({ relatedPriority: 0 })).success).toBe(false);
  });
});

describe("CommercialPlanSchema — rigor geral", () => {
  it("rejeita campos extras (.strict()) em qualquer nível", () => {
    const plan = validPlan();
    expect(
      CommercialPlanSchema.safeParse({ ...plan, campoInventado: "x" }).success,
    ).toBe(false);
    expect(
      PrioritySchema.safeParse({ ...validPriority(), campoInventado: "x" }).success,
    ).toBe(false);
  });

  it("rejeita primaryBottleneck fora do enum de dimensões", () => {
    const plan = validPlan({ primaryBottleneck: "inventado" });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("indicators.currentValue/targetValue são texto, nunca número (evita reabrir a porta para a IA inventar um valor numérico solto)", () => {
    const plan = validPlan({
      indicators: [{ name: "Taxa", currentValue: 20, targetValue: 35, frequency: "weekly" }],
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("aceita indicador com valores desconhecidos (null), nunca obriga um número que não existe", () => {
    const plan = validPlan({
      indicators: [{ name: "Taxa", currentValue: null, targetValue: null, frequency: "monthly" }],
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("limita limitations e weeklyManagerAgenda a um tamanho razoável (evita agenda/calendário completo)", () => {
    const plan = validPlan({
      weeklyManagerAgenda: Array.from({ length: 7 }, () => ({ focus: "x", activities: ["y"] })),
    });
    expect(CommercialPlanSchema.safeParse(plan).success).toBe(false);
  });
});
