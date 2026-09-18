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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
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
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
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

  it("aceita a meta citada com separador de milhar pt-BR (ex.: \"R$ 300.000\") quando o contexto tem 300000 puro — bug real: IA escreveu a própria meta e foi rejeitada", () => {
    const contextWithGoal = JSON.stringify({ metrics: { monthlyGoal: 300000 } });
    const plan = basePlan({
      goalGapInterpretation: "O gap para a meta de R$ 300.000 está concentrado na conversão.",
    });
    expect(findUngroundedNumbers(plan, contextWithGoal)).toEqual([]);
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

  it("não varre blogBrief/richMaterialBrief/paidTrafficBrief (igual a details) — números criativos de copy não travam a validação", () => {
    const plan = basePlan({
      plan90Days: {
        ...basePlan().plan90Days,
        days1to30: [
          {
            title: "Post de blog",
            objective: "Objetivo",
            actionType: "content_blog",
            details: ["5 sinais de dependência de indicação"],
            blogBrief: {
              subtitle: "Um gancho qualquer com 99% citado sem vir do contexto.",
              sections: [
                { heading: "H2 com número 47 solto", body: "Corpo com 123 solto, também não vindo do contexto." },
                { heading: "Segunda seção", body: "Mais texto de apoio." },
              ],
            },
            richMaterialBrief: null,
            paidTrafficBrief: null,
            cadenceBrief: null,
            suggestedOwner: "Marketing",
            deadline: "Semana 1",
            indicator: "Indicador",
            completionCriteria: "Critério",
            relatedPriority: 1,
          },
        ],
      },
    });
    expect(findUngroundedNumbers(plan, "{}")).toEqual([]);
  });

  it("não varre cadenceBrief (igual a details) — números soltos na copy da cadência não travam a validação", () => {
    const plan = basePlan({
      plan90Days: {
        ...basePlan().plan90Days,
        days1to30: [
          {
            title: "Cadência de follow-up",
            objective: "Objetivo",
            actionType: "crm_pipeline",
            details: ["Follow-up em D+2, D+5 e D+10"],
            blogBrief: null,
            richMaterialBrief: null,
            paidTrafficBrief: null,
            cadenceBrief: {
              touchpoints: [
                { moment: "D+2", channel: "E-mail", copy: "Já são 47 dias sem resposta? Vamos conversar." },
                { moment: "D+5", channel: "WhatsApp", copy: "99% dos clientes fecham depois desse toque." },
              ],
            },
            suggestedOwner: "Vendas",
            deadline: "Semana 1",
            indicator: "Indicador",
            completionCriteria: "Critério",
            relatedPriority: 1,
          },
        ],
      },
    });
    expect(findUngroundedNumbers(plan, "{}")).toEqual([]);
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
