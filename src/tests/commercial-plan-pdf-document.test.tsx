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
    strategicSummary: {
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
    },
    phaseSummaries: {
      days1to30: { goal: "Meta do mês 1.", milestone: "Marco do mês 1." },
      days31to60: { goal: "Meta do mês 2.", milestone: "Marco do mês 2." },
      days61to90: { goal: "Meta do mês 3.", milestone: "Marco do mês 3." },
    },
    plan90Days: {
      days1to30: [
        {
          title: "Formalizar critério de qualificação (MQL)",
          objective: "Definir e documentar o critério com o time.",
          actionType: "sales_process",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          landingPageBrief: null,
          playbookBrief: null,
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
          actionType: "content_blog",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: {
            subtitle: "Gancho do post para atrair quem busca esse tema.",
            sections: [
              { heading: "Por que isso importa agora?", body: "Parágrafo de desenvolvimento do primeiro H2." },
              { heading: "Como resolver na prática?", body: "Parágrafo de desenvolvimento do segundo H2." },
            ],
          },
          richMaterialBrief: null,
          paidTrafficBrief: null,
          cadenceBrief: null,
          landingPageBrief: null,
          playbookBrief: null,
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
          actionType: "paid_traffic",
          details: ["Detalhe 1 da ação", "Detalhe 2 da ação"],
          blogBrief: null,
          richMaterialBrief: null,
          paidTrafficBrief: {
            primaryText: "Pare de depender só de indicação para fechar negócio.",
            headline: "Título do criativo do anúncio",
            subheadline: "Linha de apoio com a dor específica do público-alvo.",
            ctaText: "Saiba mais",
          },
          cadenceBrief: null,
          landingPageBrief: null,
          playbookBrief: null,
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
    companyWebsite: "codebit.com.br" as string | null,
    generatedAt: "2026-01-05T00:00:00.000Z",
    plan: validPlan(),
    funnelStages: [CALCULABLE_STAGE, UNCALCULABLE_STAGE],
    primaryBottleneck: "conversion" as const,
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
  it("renderiza um PDF válido para um plano normal (gargalo de conversão)", async () => {
    await renderAndAssertValidPdf(baseProps());
  });

  it("renderiza um PDF válido para um plano com gargalo de demanda", async () => {
    await renderAndAssertValidPdf(
      baseProps({ primaryBottleneck: "demand", plan: validPlan({ primaryBottleneck: "demand" }) }),
    );
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

  it("renderiza o brief de material rico (seções + ideia de capa) sem lançar erro", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            ...validPlan().plan90Days,
            days31to60: [
              {
                ...validPlan().plan90Days.days31to60[0],
                actionType: "rich_material",
                blogBrief: null,
                richMaterialBrief: {
                  format: "quiz interativo",
                  subtitle: "Proposta de valor do material.",
                  sections: [
                    { title: "Pergunta 1", description: "O que a pessoa encontra aqui." },
                    { title: "Pergunta 2", description: "O que a pessoa encontra aqui." },
                    { title: "Pergunta 3", description: "O que a pessoa encontra aqui." },
                  ],
                  coverIdea: "Capa azul, minimalista, com um ícone de funil.",
                },
                paidTrafficBrief: null,
              },
            ],
          },
        }),
      }),
    );
  });

  it("renderiza a cadência de 5 dias e o passo a passo do playbook sem lançar erro", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            ...validPlan().plan90Days,
            days1to30: [
              {
                ...validPlan().plan90Days.days1to30[0],
                playbookBrief: {
                  steps: [
                    { title: "Mapear o cliente ideal", howTo: "Liste os melhores clientes e o que têm em comum." },
                    { title: "Roteiro de qualificação", howTo: "Escreva as perguntas de cada etapa." },
                    { title: "Objeções", howTo: "Registre as respostas que funcionam." },
                    { title: "Documentar e treinar", howTo: "Centralize num documento e treine o time." },
                  ],
                  adoptionTip: "Revise todo mês na reunião comercial.",
                },
              },
            ],
            days61to90: [
              {
                ...validPlan().plan90Days.days61to90[0],
                actionType: "crm_pipeline",
                paidTrafficBrief: null,
                cadenceBrief: {
                  days: [
                    { channels: ["email", "whatsapp"], goal: "Primeiro contato e envio do material" },
                    { channels: ["phone", "whatsapp"], goal: "Qualificar a necessidade" },
                    { channels: ["linkedin"], goal: "Gerar valor com um caso" },
                    { channels: ["phone"], goal: "Tratar objeção" },
                    { channels: ["email"], goal: "Encerrar ou agendar" },
                  ],
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it("renderiza o brief de landing page (hero, formulário, seções) sem lançar erro", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            ...validPlan().plan90Days,
            days31to60: [
              {
                ...validPlan().plan90Days.days31to60[0],
                actionType: "landing_page",
                blogBrief: null,
                landingPageBrief: {
                  name: "Orçamento técnico",
                  url: "/orcamento-tecnico",
                  goal: "Capturar leads prontos para orçamento.",
                  heroHeadline: "Receba um orçamento técnico em 24h",
                  heroSubheadline: "Fale com um especialista sem compromisso.",
                  formFields: ["Nome", "WhatsApp", "Segmento da empresa"],
                  buttonText: "Quero meu orçamento técnico",
                  sections: [
                    { title: "Como funciona", description: "x" },
                    { title: "Prova social", description: "x" },
                    { title: "Diferenciais", description: "x" },
                    { title: "FAQ", description: "x" },
                  ],
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it("renderiza os mockups de material rico, anúncio e landing page juntos, com e sem site informado", async () => {
    const base = validPlan().plan90Days.days1to30[0];
    const plan = validPlan({
      plan90Days: {
        ...validPlan().plan90Days,
        days1to30: [
          {
            ...base,
            actionType: "rich_material",
            title: "Guia de Especificação de Válvulas Industriais",
            richMaterialBrief: {
              format: "e-book + planilha",
              subtitle: "Roteiro prático para especificar com segurança.",
              sections: [
                { title: "Condições do processo", description: "Quais dados levantar." },
                { title: "Tipo de válvula", description: "Quando usar cada uma." },
                { title: "Materiais", description: "Compatibilidade química." },
              ],
              coverIdea: "Capa azul-marinho com corte técnico de válvula.",
            },
          },
          {
            ...base,
            actionType: "paid_traffic",
            paidTrafficBrief: {
              primaryText: "Engenheiros de manutenção: 6 capítulos práticos.",
              headline: "Sua válvula foi especificada para durar?",
              subheadline: "Baixe o guia gratuito.",
              ctaText: "Baixar",
            },
          },
          {
            ...base,
            actionType: "landing_page",
            landingPageBrief: {
              name: "Orçamento técnico",
              url: "/orcamento-tecnico",
              goal: "Converter visitantes em pedidos de orçamento.",
              heroHeadline: "Válvulas industriais com engenharia de aplicação",
              heroSubheadline: "Receba uma proposta técnica validada.",
              formFields: ["Nome", "Empresa", "WhatsApp", "Tipo de válvula"],
              buttonText: "Quero minha proposta técnica",
              sections: [
                { title: "Como funciona", description: "x" },
                { title: "Prova social", description: "x" },
                { title: "Diferenciais", description: "x" },
                { title: "FAQ", description: "x" },
              ],
            },
          },
        ],
      },
    });

    await renderAndAssertValidPdf(baseProps({ plan }));
    await renderAndAssertValidPdf(baseProps({ plan, companyWebsite: null }));
  });

  it("plano com número máximo de ações por fase (7) ainda renderiza", async () => {
    const action = validPlan().plan90Days.days1to30[0];
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            days1to30: Array.from({ length: 7 }, (_, i) => ({ ...action, title: `Ação ${i + 1}` })),
            days31to60: [action],
            days61to90: [action],
          },
        }),
      }),
    );
  });

  it("renderiza o resumo estratégico com o número máximo de 5 canais de mídia sem lançar erro", async () => {
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          strategicSummary: {
            headline: "Meta do trimestre.",
            positioning: "Posicionamento.",
            channelStrategy: "Estratégia de canais.",
            contentJourney: "Jornada de conteúdo.",
            mediaBudgetPriority: [
              { channel: "Google Ads", priority: "alta" },
              { channel: "LinkedIn Ads", priority: "media" },
              { channel: "Meta Ads", priority: "media" },
              { channel: "SEO", priority: "baixa" },
              { channel: "Testes", priority: "teste" },
            ],
            commercialProcess: "Processo comercial.",
            premises: "Premissas.",
          },
        }),
      }),
    );
  });

  it("renderiza o cronograma das frentes com várias frentes diferentes sem lançar erro", async () => {
    const action = validPlan().plan90Days.days1to30[0];
    await renderAndAssertValidPdf(
      baseProps({
        plan: validPlan({
          plan90Days: {
            days1to30: [
              { ...action, actionType: "content_blog" },
              { ...action, actionType: "seo" },
              { ...action, actionType: "paid_traffic" },
            ],
            days31to60: [{ ...action, actionType: "crm_pipeline" }],
            days61to90: [{ ...action, actionType: "sales_training" }],
          },
        }),
      }),
    );
  });
});
