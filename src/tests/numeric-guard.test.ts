import { describe, expect, it } from "vitest";

import { findUngroundedNumbers } from "@/lib/ai/numeric-guard";
import type { CommercialPlan } from "@/schemas/commercial-plan";

function basePlan(overrides: Partial<CommercialPlan> = {}): CommercialPlan {
  return {
    executiveDiagnosis: "Diagnóstico executivo.",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "Evidência.", source: "declared_answer" }],
    rootCause: { description: "Causa raiz sem números.", evidence: [{ summary: "x", source: "declared_answer" }] },
    goalGapInterpretation: "Interpretação do gap sem números soltos.",
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
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 1",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 1,
        },
      ],
      days31to60: [
        {
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 5",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 2,
        },
      ],
      days61to90: [
        {
          title: "Ação",
          objective: "Objetivo",
          suggestedOwner: "Vendas",
          deadline: "Semana 9",
          indicator: "Indicador",
          completionCriteria: "Critério",
          relatedPriority: 3,
        },
      ],
    },
    weeklyManagerAgenda: [{ focus: "Foco", activities: ["Atividade"] }],
    indicators: [{ name: "Taxa", currentValue: null, targetValue: null, frequency: "weekly" }],
    limitations: ["Limitação."],
    consultativeCta: { message: "CTA." },
    ...overrides,
  };
}

const CONTEXT_WITH_20_PERCENT = JSON.stringify({
  scores: [{ dimension: "conversion", score: 45, hasData: true }],
  funnelAnalysis: { conversionRates: { leadToOpportunity: { percent: 20, source: "declared_bucket" } } },
  dataQuality: { percentage: 60 },
});

describe("findUngroundedNumbers", () => {
  it("não acusa nada quando os campos de risco não citam nenhum número", () => {
    expect(findUngroundedNumbers(basePlan(), CONTEXT_WITH_20_PERCENT)).toEqual([]);
  });

  it("aceita um número que de fato aparece no contexto (ex.: a taxa de 20% calculada)", () => {
    const plan = basePlan({
      goalGapInterpretation: "O gap está concentrado na conversão, hoje em 20% de leads para oportunidades.",
    });
    expect(findUngroundedNumbers(plan, CONTEXT_WITH_20_PERCENT)).toEqual([]);
  });

  it("rejeita um número citado que não existe em lugar nenhum do contexto (número inventado)", () => {
    const plan = basePlan({
      goalGapInterpretation: "A conversão está em 47%, bem abaixo do esperado.",
    });
    const findings = findUngroundedNumbers(plan, CONTEXT_WITH_20_PERCENT);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toEqual({ field: "goalGapInterpretation", value: "47" });
  });

  it("rejeita um número inventado no valor de um indicador", () => {
    const plan = basePlan({
      indicators: [{ name: "Taxa", currentValue: "35%", targetValue: null, frequency: "weekly" }],
    });
    const findings = findUngroundedNumbers(plan, CONTEXT_WITH_20_PERCENT);
    expect(findings.some((f) => f.field === "indicators[0].currentValue" && f.value === "35")).toBe(true);
  });

  it("nunca acusa números estruturais do formato (1-3 prioridades, fases de 30/60/90 dias)", () => {
    const plan = basePlan({
      rootCause: {
        description: "As 3 prioridades atacam as fases de 30, 60 e 90 dias do plano.",
        evidence: [{ summary: "x", source: "declared_answer" }],
      },
    });
    expect(findUngroundedNumbers(plan, "{}")).toEqual([]);
  });

  it("não varre campos fora da lista de risco (ex.: título de prioridade) — evita falso positivo em texto estrutural", () => {
    const plan = basePlan({
      priorities: basePlan().priorities.map((p, i) => (i === 0 ? { ...p, title: "Prioridade número 99" } : p)),
    });
    expect(findUngroundedNumbers(plan, "{}")).toEqual([]);
  });
});
