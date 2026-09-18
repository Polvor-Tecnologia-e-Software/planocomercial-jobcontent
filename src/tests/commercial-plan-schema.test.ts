import { describe, expect, it } from "vitest";

import {
  ActionTypeSchema,
  BlogBriefSchema,
  CadenceBriefSchema,
  CommercialPlanSchema,
  PaidTrafficBriefSchema,
  PlanActionSchema,
  PrioritySchema,
  RichMaterialBriefSchema,
} from "@/schemas/commercial-plan";

function validAction(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Padronizar critério de qualificação",
    objective: "Definir MQL claro para o time",
    actionType: "sales_process",
    details: ["Script com 5 perguntas de qualificação", "Critério de MQL documentado"],
    blogBrief: null,
    richMaterialBrief: null,
    paidTrafficBrief: null,
    cadenceBrief: null,
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

describe("ActionTypeSchema — tipo de ação (ícone/cor na tela e no PDF)", () => {
  it.each([
    "content_blog",
    "rich_material",
    "paid_traffic",
    "seo",
    "sales_process",
    "sales_training",
    "crm_pipeline",
    "other",
  ])("aceita o tipo %s", (actionType) => {
    expect(ActionTypeSchema.safeParse(actionType).success).toBe(true);
  });

  it("rejeita um tipo fora da lista fechada (a IA não pode inventar uma categoria nova)", () => {
    expect(ActionTypeSchema.safeParse("marketing_generico").success).toBe(false);
  });

  it("PlanActionSchema exige actionType — não é opcional", () => {
    const { actionType, ...withoutActionType } = validAction();
    expect(actionType).toBeDefined();
    expect(PlanActionSchema.safeParse(withoutActionType).success).toBe(false);
  });
});

describe("PlanActionSchema — details (2 a 4 ideias concretas da ação)", () => {
  it("aceita 2, 3 ou 4 itens", () => {
    expect(PlanActionSchema.safeParse(validAction({ details: ["a", "b"] })).success).toBe(true);
    expect(PlanActionSchema.safeParse(validAction({ details: ["a", "b", "c"] })).success).toBe(true);
    expect(PlanActionSchema.safeParse(validAction({ details: ["a", "b", "c", "d"] })).success).toBe(true);
  });

  it("rejeita menos de 2 itens (pelo menos 1 não é 'detalhado')", () => {
    expect(PlanActionSchema.safeParse(validAction({ details: ["só um"] })).success).toBe(false);
    expect(PlanActionSchema.safeParse(validAction({ details: [] })).success).toBe(false);
  });

  it("rejeita mais de 4 itens", () => {
    expect(PlanActionSchema.safeParse(validAction({ details: ["a", "b", "c", "d", "e"] })).success).toBe(
      false,
    );
  });

  it("details é obrigatório — não é opcional", () => {
    const { details, ...withoutDetails } = validAction();
    expect(details).toBeDefined();
    expect(PlanActionSchema.safeParse(withoutDetails).success).toBe(false);
  });
});

describe("PlanActionSchema — blogBrief/richMaterialBrief/paidTrafficBrief/cadenceBrief (desenvolvimento completo de conteúdo)", () => {
  it("aceita os quatro campos null (ação que não é de conteúdo nem cadência)", () => {
    expect(
      PlanActionSchema.safeParse(
        validAction({ blogBrief: null, richMaterialBrief: null, paidTrafficBrief: null, cadenceBrief: null }),
      ).success,
    ).toBe(true);
  });

  it.each(["blogBrief", "richMaterialBrief", "paidTrafficBrief", "cadenceBrief"])(
    "%s é obrigatório — não pode ficar ausente (nem null nem preenchido)",
    (field) => {
      const action = validAction() as Record<string, unknown>;
      delete action[field];
      expect(PlanActionSchema.safeParse(action).success).toBe(false);
    },
  );

  it("aceita um blogBrief com 2 a 4 seções", () => {
    const brief = {
      subtitle: "Gancho do post",
      sections: [
        { heading: "H2 um", body: "Parágrafo um." },
        { heading: "H2 dois", body: "Parágrafo dois." },
      ],
    };
    expect(BlogBriefSchema.safeParse(brief).success).toBe(true);
    expect(
      PlanActionSchema.safeParse(validAction({ actionType: "content_blog", blogBrief: brief })).success,
    ).toBe(true);
  });

  it("rejeita um blogBrief com menos de 2 ou mais de 4 seções", () => {
    const oneSection = {
      subtitle: "Gancho",
      sections: [{ heading: "H2", body: "Parágrafo." }],
    };
    expect(BlogBriefSchema.safeParse(oneSection).success).toBe(false);

    const fiveSections = {
      subtitle: "Gancho",
      sections: Array.from({ length: 5 }, (_, i) => ({ heading: `H2 ${i}`, body: "Parágrafo." })),
    };
    expect(BlogBriefSchema.safeParse(fiveSections).success).toBe(false);
  });

  it("aceita um richMaterialBrief com 3 a 8 seções e ideia de capa (formato ebook)", () => {
    const brief = {
      format: "ebook",
      subtitle: "Proposta de valor do material",
      sections: [
        { title: "Capítulo 1", description: "O que a pessoa encontra aqui." },
        { title: "Capítulo 2", description: "O que a pessoa encontra aqui." },
        { title: "Capítulo 3", description: "O que a pessoa encontra aqui." },
      ],
      coverIdea: "Capa azul, minimalista, com um ícone de funil.",
    };
    expect(RichMaterialBriefSchema.safeParse(brief).success).toBe(true);
  });

  it("aceita formatos de material rico além de ebook (quiz, checklist, calculadora etc.)", () => {
    for (const format of ["quiz interativo", "checklist", "calculadora", "webinar", "infográfico", "template"]) {
      const brief = {
        format,
        subtitle: "Proposta de valor",
        sections: [
          { title: "Item 1", description: "x" },
          { title: "Item 2", description: "x" },
          { title: "Item 3", description: "x" },
        ],
        coverIdea: "Ideia de capa",
      };
      expect(RichMaterialBriefSchema.safeParse(brief).success).toBe(true);
    }
  });

  it("format é obrigatório — não é opcional", () => {
    const { format, ...brief } = {
      format: "ebook",
      subtitle: "Proposta de valor",
      sections: [
        { title: "Item 1", description: "x" },
        { title: "Item 2", description: "x" },
        { title: "Item 3", description: "x" },
      ],
      coverIdea: "Ideia de capa",
    };
    expect(format).toBeDefined();
    expect(RichMaterialBriefSchema.safeParse(brief).success).toBe(false);
  });

  it("rejeita um richMaterialBrief com menos de 3 seções", () => {
    const brief = {
      format: "checklist",
      subtitle: "Proposta de valor",
      sections: [{ title: "Só um", description: "x" }],
      coverIdea: "Ideia de capa",
    };
    expect(RichMaterialBriefSchema.safeParse(brief).success).toBe(false);
  });

  it("aceita um paidTrafficBrief com headline e subheadline", () => {
    const brief = { headline: "Título do criativo", subheadline: "Linha de apoio do anúncio" };
    expect(PaidTrafficBriefSchema.safeParse(brief).success).toBe(true);
  });

  it("rejeita um brief com campo extra (.strict() em cada schema)", () => {
    const brief = { headline: "Título", subheadline: "Apoio", campoInventado: "x" };
    expect(PaidTrafficBriefSchema.safeParse(brief).success).toBe(false);
  });

  it("aceita um cadenceBrief com 2 a 5 toques (moment + channel + copy)", () => {
    const brief = {
      touchpoints: [
        { moment: "D+2", channel: "E-mail", copy: "Oi [Nome], só reforçando a proposta." },
        { moment: "D+5", channel: "WhatsApp", copy: "Ficou alguma dúvida?" },
      ],
    };
    expect(CadenceBriefSchema.safeParse(brief).success).toBe(true);
    expect(
      PlanActionSchema.safeParse(validAction({ actionType: "crm_pipeline", cadenceBrief: brief })).success,
    ).toBe(true);
  });

  it("rejeita um cadenceBrief com menos de 2 ou mais de 5 toques", () => {
    const oneTouchpoint = { touchpoints: [{ moment: "D+2", channel: "E-mail", copy: "x" }] };
    expect(CadenceBriefSchema.safeParse(oneTouchpoint).success).toBe(false);

    const sixTouchpoints = {
      touchpoints: Array.from({ length: 6 }, (_, i) => ({
        moment: `D+${i}`,
        channel: "E-mail",
        copy: "x",
      })),
    };
    expect(CadenceBriefSchema.safeParse(sixTouchpoints).success).toBe(false);
  });

  it("rejeita um cadenceBrief com campo extra (.strict())", () => {
    const brief = {
      touchpoints: [
        { moment: "D+2", channel: "E-mail", copy: "x", campoInventado: "y" },
        { moment: "D+5", channel: "WhatsApp", copy: "x" },
      ],
    };
    expect(CadenceBriefSchema.safeParse(brief).success).toBe(false);
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
