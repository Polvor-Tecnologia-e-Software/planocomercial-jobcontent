import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { CommercialPlanDocument } from "@/lib/pdf/commercial-plan-document";
import type { CommercialPlan } from "@/schemas/commercial-plan";
import type { ResultFunnelStage } from "@/server/get-commercial-plan-result";

function validPlan(overrides: Partial<CommercialPlan> = {}): CommercialPlan {
  return {
    executiveDiagnosis: "A empresa perde oportunidades por falta de critério de qualificação de leads.",
    primaryBottleneck: "conversion",
    secondaryRisk: null,
    evidence: [{ summary: "42% dos leads não passam por critério de qualificação.", source: "declared_answer" }],
    rootCause: {
      description: "Critério de qualificação existe mas não é seguido pelo time.",
      evidence: [
        { summary: "Baixa geração de oportunidades", source: "deterministic_calculation" },
        { summary: "Dependência de indicação", source: "declared_answer" },
      ],
    },
    goalGapInterpretation: "O gap está concentrado na etapa de qualificação, não de geração de leads.",
    priorities: [1, 2, 3].map((n) => ({
      title: `Prioridade ${n}`,
      rationale: "Motivo detalhado da prioridade.",
      problemSolved: "Problema resolvido por esta prioridade.",
      expectedImpact: "Impacto esperado no negócio.",
      primaryIndicator: "Indicador principal",
      timeframe: "30 dias",
    })),
    plan90Days: {
      days1to30: [
        {
          title: "Formalizar critério de qualificação (MQL)",
          objective: "Definir e documentar o critério com o time.",
          suggestedOwner: "Marketing",
          deadline: "Semana 2",
          indicator: "% de leads qualificados",
          completionCriteria: "Critério documentado e aplicado por 2 semanas seguidas.",
          relatedPriority: 1,
        },
      ],
      days31to60: [
        {
          title: "Ação da fase 2",
          objective: "Objetivo da fase 2.",
          suggestedOwner: "Vendas",
          deadline: "Semana 6",
          indicator: "Indicador da fase 2",
          completionCriteria: "Critério da fase 2.",
          relatedPriority: 2,
        },
      ],
      days61to90: [
        {
          title: "Ação da fase 3",
          objective: "Objetivo da fase 3.",
          suggestedOwner: "Vendas",
          deadline: "Semana 10",
          indicator: "Indicador da fase 3",
          completionCriteria: "Critério da fase 3.",
          relatedPriority: 3,
        },
      ],
    },
    weeklyManagerAgenda: [
      { focus: "Revisão de pipeline", activities: ["Revisar oportunidades paradas"] },
      { focus: "1:1 com vendedores", activities: ["Checar bloqueios", "Alinhar prioridades"] },
      { focus: "Análise semanal", activities: ["Revisar indicadores"] },
    ],
    indicators: [
      { name: "Taxa de conversão lead → oportunidade", currentValue: "20%", targetValue: "35%", frequency: "weekly" },
    ],
    limitations: ["Qualidade de dados média — algumas respostas foram 'não sei'."],
    consultativeCta: { message: "Vamos aprofundar esse diagnóstico numa conversa com nosso time?" },
    ...overrides,
  };
}

const CALCULABLE_STAGE: ResultFunnelStage = {
  key: "leads",
  label: "Leads",
  current: 100,
  required: 500,
  gap: 400,
  ratePercent: null,
  rateLabel: null,
  uncalculable: false,
};

const UNCALCULABLE_STAGE: ResultFunnelStage = {
  key: "customers",
  label: "Vendas",
  current: null,
  required: null,
  gap: null,
  ratePercent: null,
  rateLabel: null,
  uncalculable: true,
};

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "CodeBit Tecnologia",
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

async function renderAndAssertValidPdf(props: ReturnType<typeof baseProps>) {
  const buffer = await renderToBuffer(<CommercialPlanDocument {...props} />);
  expect(Buffer.isBuffer(buffer)).toBe(true);
  expect(buffer.length).toBeGreaterThan(0);
  expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  return buffer;
}

describe("CommercialPlanDocument — renderização", () => {
  it("renderiza um PDF válido para um plano normal (gargalo de conversão, sem Inbound)", async () => {
    await renderAndAssertValidPdf(baseProps());
  });

  it("renderiza um PDF válido para um plano com Inbound Marketing (gargalo de demanda)", async () => {
    const buffer = await renderAndAssertValidPdf(
      baseProps({ primaryBottleneck: "demand", plan: validPlan({ primaryBottleneck: "demand" }) }),
    );
    // heurística simples: o PDF deve ser maior que a versão sem a seção de Inbound
    const withoutInbound = await renderToBuffer(<CommercialPlanDocument {...baseProps()} />);
    expect(buffer.length).not.toBe(withoutInbound.length);
  });

  it("renderiza sem quebrar quando o risco secundário (não o principal) é demanda", async () => {
    await renderAndAssertValidPdf(baseProps({ primaryBottleneck: "processes", secondaryRisk: "demand" }));
  });

  it("renderiza a seção de Oportunidades de SEO, incluindo palavras-chave de nicho não exploradas", async () => {
    const buffer = await renderAndAssertValidPdf(
      baseProps({
        seoOpportunities: [
          {
            keyword: "consultoria financeira",
            avgMonthlySearches: 1000,
            competition: "low",
            opportunityRank: 1,
            coverageGap: false,
          },
          {
            keyword: "planejamento tributário para pme",
            avgMonthlySearches: 300,
            competition: "medium",
            opportunityRank: 2,
            coverageGap: true,
          },
        ],
      }),
    );
    const withoutSeo = await renderToBuffer(<CommercialPlanDocument {...baseProps()} />);
    expect(buffer.length).not.toBe(withoutSeo.length);
  });

  it("renderiza sem quebrar com todas as etapas do funil não calculáveis", async () => {
    await renderAndAssertValidPdf(
      baseProps({ funnelStages: [UNCALCULABLE_STAGE, UNCALCULABLE_STAGE, UNCALCULABLE_STAGE] }),
    );
  });

  it("renderiza textos longos sem lançar erro", async () => {
    const longText = "Diagnóstico detalhado com muito contexto adicional sobre a operação comercial. ".repeat(6).trim();
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          executiveDiagnosis: longText.slice(0, 590),
          goalGapInterpretation: longText.slice(0, 490),
        }),
      }),
    );
  });

  it("renderiza caracteres acentuados e especiais do português corretamente (sem lançar erro)", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        companyName: "Açaí & Café Ltda. — São João d'Água Fria",
        plan: validPlan({
          executiveDiagnosis:
            "A operação não converte visitantes em oportunidades — há dependência de indicação e ausência de qualificação, segundo a análise.",
          limitations: ["Não é possível garantir precisão absoluta — dados parciais, 'não sei' em algumas respostas."],
        }),
      }),
    );
  });

  it("renderiza sem quebrar quando não há evidências/prioridades extras além do mínimo", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          evidence: [{ summary: "Única evidência.", source: "confirmed_data" }],
          rootCause: { description: "Causa única.", evidence: [{ summary: "x", source: "inference" }] },
        }),
      }),
    );
  });

  it("plano com número máximo de ações por fase (5) ainda renderiza", async () => {
    const action = validPlan().plan90Days.days1to30[0];
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            days1to30: Array.from({ length: 5 }, (_, i) => ({ ...action, title: `Ação ${i + 1}` })),
            days31to60: [action],
            days61to90: [action],
          },
        }),
      }),
    );
  });
});
