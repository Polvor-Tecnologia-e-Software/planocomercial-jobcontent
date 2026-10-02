/**
 * Schemas Zod da saída estruturada do plano comercial de 90 dias gerado
 * por IA (ver src/lib/ai/commercial-plan.ts). ".strict()" em todo objeto
 * — rejeita qualquer campo que a IA inventar além do combinado, em vez de
 * silenciosamente ignorar (mesma convenção de
 * src/lib/ai/site-analysis-schema.ts).
 *
 * A IA INTERPRETA os números das etapas anteriores (score, gaps, taxas,
 * qualidade de dados) — nunca os recalcula. Por isso quase todo campo
 * numérico aqui vira texto (ex.: indicators.currentValue é string, não
 * number): o texto só pode citar um número que já veio pronto no
 * contexto, nunca inventar um; ver src/lib/ai/numeric-guard.ts para a
 * checagem que impede números não rastreáveis ao contexto.
 */
import { z } from "zod";

// ─── Evidência (hierarquia de confiança) ────────────────────────────────────
export const EvidenceSourceSchema = z.enum([
  "deterministic_calculation",
  "confirmed_data",
  "declared_answer",
  "site_fact",
  "inference",
]);

export const EvidenceSchema = z
  .object({
    summary: z.string().min(1).max(300),
    source: EvidenceSourceSchema,
  })
  .strict();

// ─── Causa-raiz ──────────────────────────────────────────────────────────────
export const RootCauseSchema = z
  .object({
    description: z.string().min(1).max(500),
    evidence: z.array(EvidenceSchema).min(1).max(5),
  })
  .strict();

// ─── Prioridades (exatamente 3) ──────────────────────────────────────────────
export const PrioritySchema = z
  .object({
    title: z.string().min(1).max(100),
    rationale: z.string().min(1).max(400),
    problemSolved: z.string().min(1).max(300),
    expectedImpact: z.string().min(1).max(300),
    primaryIndicator: z.string().min(1).max(150),
    timeframe: z.string().min(1).max(50),
  })
  .strict();

// ─── Tipo de ação (seção 4/5 do pedido: ações práticas de marketing E
// comerciais, visualmente identificáveis na tela e no PDF) ──────────────────
export const ActionTypeSchema = z.enum([
  /** Blog post / conteúdo educativo (SEO ou nutrição). */
  "content_blog",
  /** Ebook, guia, checklist, quiz, calculadora, webinar, infográfico ou outro material rico para captura de leads — não é sinônimo de ebook. */
  "rich_material",
  /** Landing page dedicada (hero, formulário, seções de conteúdo) — diferente de "seo" (otimização de página já existente) e de "rich_material" (a oferta que a LP promove). */
  "landing_page",
  /** Anúncio de tráfego pago (Google Ads, Meta Ads, LinkedIn Ads etc.). */
  "paid_traffic",
  /** SEO on-page/técnico, pesquisa de palavras-chave, otimização orgânica. */
  "seo",
  /** Processo/playbook comercial: script de qualificação, roteiro de abordagem, tratamento de objeções. */
  "sales_process",
  /** Capacitação do time comercial ligada a uma lacuna específica. */
  "sales_training",
  /** Disciplina de CRM/pipeline: follow-up, cadência, critério de estágio. */
  "crm_pipeline",
  /** Não se encaixa nos anteriores (ex.: dimensionamento de equipe, parceria). */
  "other",
]);

// ─── Briefs de conteúdo (um campo nullable por tipo, nunca uma union —
// z.discriminatedUnion/z.union nunca foi testado neste projeto com o modo
// "Structured Outputs" da OpenAI (strict:true), que já se mostrou sensível
// a construções de schema não testadas antes (ver histórico de
// commercial-plan.ts). Três campos simples e nullable, mesmo padrão já
// comprovado em produção (ex.: secondaryRisk, indicators[].currentValue),
// é mais verboso mas elimina esse risco. Pedido do usuário: as ideias de
// blog/ebook precisavam vir muito mais desenvolvidas do que os bullets
// curtos de `details`, quase um rascunho pronto pra produção.
export const BlogBriefSchema = z
  .object({
    subtitle: z.string().min(1).max(300),
    /**
     * 2 a 4 seções (H2 + parágrafo) — o esqueleto real do post, não um
     * resumo de uma linha. `body` é o texto de apoio de UM parágrafo (não
     * o artigo inteiro), na voz e argumentos que o post usaria. Esses
     * limites já chegaram a ser reduzidos temporariamente (2-3 seções,
     * 450 chars) pra caber no teto de saída de um modelo anterior — o
     * modelo atual (gpt-4.1-mini, ver AI_MODEL em .env.local e comentário
     * em src/lib/ai/commercial-plan.ts) tem teto de saída bem maior
     * (~32k tokens), então os limites ficam no tamanho completo mesmo com
     * a cadência de 2 posts por FASE (6 no plano inteiro).
     */
    sections: z
      .array(
        z
          .object({
            heading: z.string().min(1).max(150),
            body: z.string().min(1).max(600),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

export const RichMaterialBriefSchema = z
  .object({
    /**
     * O TIPO de material rico (ex.: "ebook", "quiz interativo",
     * "checklist", "calculadora", "webinar", "infográfico", "template",
     * "planilha") — texto livre de propósito: rich_material não é
     * sinônimo de ebook, e o formato certo depende do público/tema, não
     * de um padrão fixo. Pense nesse campo antes de preencher o resto —
     * ele decide o que "sections" representa (capítulos pra ebook,
     * perguntas pra quiz, itens pra checklist, campos pra calculadora).
     */
    format: z.string().min(1).max(60),
    subtitle: z.string().min(1).max(300),
    /** Estrutura do material — 3 a 8 seções, cada uma com o que a pessoa vai encontrar/fazer ali (não só o título). O que uma "seção" significa depende de `format` (ver comentário acima). */
    sections: z
      .array(
        z
          .object({
            title: z.string().min(1).max(150),
            description: z.string().min(1).max(300),
          })
          .strict(),
      )
      .min(3)
      .max(8),
    /** Direção visual da capa/mockup (cores, composição, o que transmitir) — não é um link de imagem, é um briefing pra quem for desenhar. */
    coverIdea: z.string().min(1).max(400),
  })
  .strict();

export const PaidTrafficBriefSchema = z
  .object({
    /** Texto de apoio acima do criativo (o "post copy" do anúncio) — a dor/gancho que faz a pessoa parar de rolar o feed, não um resumo do headline. */
    primaryText: z.string().min(1).max(250),
    headline: z.string().min(1).max(120),
    subheadline: z.string().min(1).max(160),
    /** Texto do botão do anúncio, ex.: "Baixar", "Saiba mais", "Solicitar orçamento" — nunca genérico demais tipo "Clique aqui". */
    ctaText: z.string().min(1).max(30),
  })
  .strict();

export const CadenceChannelSchema = z.enum(["email", "whatsapp", "phone", "linkedin"]);

export const CadenceBriefSchema = z
  .object({
    /**
     * Cadência de EXATAMENTE 5 dias (Dia 01 a Dia 05, na ordem — o número
     * do dia vem da posição, nunca da IA). Pedido explícito: mostrar a
     * ESTRUTURA da cadência (quais canais em cada dia e o objetivo do
     * toque), nunca a copy das mensagens — ex.: "Dia 01: e-mail +
     * WhatsApp", "Dia 02: telefone + WhatsApp". O tamanho fixo é imposto
     * pela OpenAI no modo strict (minItems = maxItems).
     */
    days: z
      .array(
        z
          .object({
            /** 1 a 3 canais usados nesse dia. */
            channels: z.array(CadenceChannelSchema).min(1).max(3),
            /** O objetivo/ação do toque nesse dia, curto (ex.: "Primeiro contato e envio do material"), nunca a mensagem pronta. */
            goal: z.string().min(1).max(140),
          })
          .strict(),
      )
      .min(5)
      .max(5),
  })
  .strict();

/**
 * Passo a passo de como MONTAR o playbook comercial proposto pela ação
 * (pedido explícito: "dê mais dicas para playbook, de como criar o
 * playbook"). Preenchido só quando actionType é "sales_process".
 */
export const PlaybookBriefSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            /** Nome do passo (ex.: "Mapear o perfil de cliente ideal"). */
            title: z.string().min(1).max(100),
            /** Como fazer na prática: o que levantar, quem envolver, o que documentar. */
            howTo: z.string().min(1).max(350),
          })
          .strict(),
      )
      .min(4)
      .max(6),
    /** Como manter o playbook vivo depois de pronto (onde documentar, como treinar e revisar). */
    adoptionTip: z.string().min(1).max(300),
  })
  .strict();

export const LandingPageBriefSchema = z
  .object({
    /** Nome curto da LP, ex.: "Orçamento técnico". */
    name: z.string().min(1).max(80),
    /** Caminho sugerido, ex.: "/orcamento-tecnico" — nunca um domínio completo. */
    url: z.string().min(1).max(80),
    /** Pra que serve essa LP especificamente (não repita o objective da ação). */
    goal: z.string().min(1).max(250),
    heroHeadline: z.string().min(1).max(150),
    heroSubheadline: z.string().min(1).max(250),
    /** 3 a 8 campos do formulário, na ordem em que apareceriam (ex.: "Nome", "WhatsApp", "Segmento da empresa"). */
    formFields: z.array(z.string().min(1).max(60)).min(3).max(8),
    /** Texto do botão de envio, ex.: "Quero minha proposta técnica" — nunca genérico como "Enviar". */
    buttonText: z.string().min(1).max(60),
    /** 4 a 8 seções da página abaixo do hero (ex.: prova social, FAQ, como funciona), cada uma com o que vai nela — não é o texto final, é o briefing de cada seção. */
    sections: z
      .array(
        z
          .object({
            title: z.string().min(1).max(80),
            description: z.string().min(1).max(250),
          })
          .strict(),
      )
      .min(4)
      .max(8),
  })
  .strict();

// ─── Resumo do planejamento estratégico (um por plano, não por ação) ────────
// Pedido explícito: layout de referência mostra um bloco de estratégia
// antes do cronograma. "mediaBudgetSplit" usa PRIORIDADE qualitativa, não
// porcentagem — deixar a IA inventar "Google 40%, LinkedIn 30%..." seria
// exatamente o tipo de métrica fantasma que numeric-guard.ts existe pra
// barrar (a IA não tem nenhum dado real de custo de mídia no contexto pra
// basear uma porcentagem). A % exibida na tela/PDF é calculada no código a
// partir da prioridade (ver src/lib/plan-media-budget.ts), nunca confiada à IA.
export const MediaChannelPrioritySchema = z.enum(["alta", "media", "baixa", "teste"]);

export const StrategicSummarySchema = z
  .object({
    /** A meta do trimestre em uma frase, ex.: "Construir um canal digital próprio que entregue 45 leads qualificados por mês até o dia 90." — só pode citar número que já existe no contexto (mesma regra de goalGapInterpretation). */
    headline: z.string().min(1).max(250),
    positioning: z.string().min(1).max(350),
    channelStrategy: z.string().min(1).max(350),
    contentJourney: z.string().min(1).max(350),
    /**
     * 2 a 5 canais com prioridade qualitativa (não porcentagem — ver
     * comentário acima). Cada "channel" precisa bater com um canal
     * realmente usado em alguma ação paid_traffic/seo do plano.
     */
    mediaBudgetPriority: z
      .array(
        z
          .object({
            channel: z.string().min(1).max(40),
            priority: MediaChannelPrioritySchema,
          })
          .strict(),
      )
      .min(2)
      .max(5),
    commercialProcess: z.string().min(1).max(350),
    premises: z.string().min(1).max(350),
  })
  .strict();

// ─── Plano de 90 dias (3 fases, até 7 ações cada) ────────────────────────────
export const PlanActionSchema = z
  .object({
    title: z.string().min(1).max(120),
    objective: z.string().min(1).max(300),
    /** Categoria da ação — decide o ícone/cor exibidos na tela e no PDF (ver src/lib/plan-action-types.ts). */
    actionType: ActionTypeSchema,
    /**
     * 2 a 4 ideias/detalhes CONCRETOS específicos desta ação — o
     * conteúdo real, não só a intenção (ex.: para content_blog, os
     * títulos reais dos posts sugeridos; para paid_traffic, o ângulo da
     * campanha e o público; para sales_process, os pontos do script).
     * Números de estilo "5 erros", "3 dicas" em título de conteúdo são
     * esperados aqui e não passam pela checagem de números não
     * rastreáveis (ver src/lib/ai/numeric-guard.ts) — são copy criativo,
     * não uma métrica de negócio.
     */
    details: z.array(z.string().min(1).max(200)).min(2).max(4),
    /**
     * Desenvolvimento completo do post de blog — preenchido SÓ quando
     * actionType é "content_blog"; null em qualquer outro caso. Mesma
     * isenção de `details` quanto a números criativos em título/copy —
     * ver src/lib/ai/numeric-guard.ts (riskFieldsOf não varre este campo).
     */
    blogBrief: BlogBriefSchema.nullable(),
    /** Desenvolvimento completo do material rico — preenchido SÓ quando actionType é "rich_material"; null em qualquer outro caso. */
    richMaterialBrief: RichMaterialBriefSchema.nullable(),
    /** Copy completo do anúncio — preenchido SÓ quando actionType é "paid_traffic"; null em qualquer outro caso. */
    paidTrafficBrief: PaidTrafficBriefSchema.nullable(),
    /**
     * Estrutura de uma cadência de 5 dias (canais + objetivo por dia, sem
     * copy) — só pode vir preenchido quando actionType é "crm_pipeline" E
     * a ação recomenda de fato uma cadência de contato/follow-up (não
     * quando "crm_pipeline" é usado pra outra coisa, como critério de
     * entrada/saída de estágio); null em qualquer outro caso.
     */
    cadenceBrief: CadenceBriefSchema.nullable(),
    /** Desenvolvimento completo da landing page — preenchido SÓ quando actionType é "landing_page"; null em qualquer outro caso. */
    landingPageBrief: LandingPageBriefSchema.nullable(),
    /** Passo a passo de como montar o playbook — preenchido SÓ quando actionType é "sales_process"; null em qualquer outro caso. */
    playbookBrief: PlaybookBriefSchema.nullable(),
    suggestedOwner: z.string().min(1).max(60),
    deadline: z.string().min(1).max(50),
    indicator: z.string().min(1).max(150),
    completionCriteria: z.string().min(1).max(250),
    /** Índice (1-3) da prioridade em `priorities` a que esta ação se conecta. */
    relatedPriority: z.number().int().min(1).max(3),
  })
  .strict();

/**
 * Máximo 7 por fase. A cadência fixa é POR FASE, pra QUALQUER objetivo
 * selecionado: 2 content_blog + 1 rich_material + 1 landing_page + 1
 * paid_traffic TODO MÊS (paid_traffic deixou de ser condicionado ao
 * gargalo ser demanda) — isso já soma 5, mais 1 ação comercial obrigatória
 * por fase = 6, e ainda sobra espaço pra 1 ação extra quando fizer
 * sentido. O prompt continua pedindo no máximo 7; o teto do schema é 8
 * porque ensureBlogCadence (src/lib/ai/blog-cadence.ts) pode acrescentar
 * o 2º post de blog a uma fase que a IA já entregou com 7 ações.
 */
export const PlanPhaseSchema = z.array(PlanActionSchema).min(1).max(8);

export const CommercialPlan90DaysSchema = z
  .object({
    days1to30: PlanPhaseSchema,
    days31to60: PlanPhaseSchema,
    days61to90: PlanPhaseSchema,
  })
  .strict();

// ─── Resumo de cada fase (goal + marco de sucesso) — pedido explícito do
// usuário, a partir do layout de referência: o banner colorido de cada
// mês mostra pra que serve aquele mês e como saber que deu certo. Campo
// SEPARADO de plan90Days (que continua um array simples de ações) pra não
// quebrar nenhum consumidor existente — só mais um campo no nível do
// CommercialPlanSchema. `milestone` pode citar um número (ex.: "35 leads
// no mês") desde que já exista no contexto — por isso riskFieldsOf em
// src/lib/ai/numeric-guard.ts varre os dois campos de cada fase, igual
// a goalGapInterpretation. ──────────────────────────────────────────────
export const PlanPhaseSummarySchema = z
  .object({
    /** O que este mês precisa deixar pronto/resolvido — uma frase, não uma lista de tarefas (isso já está em plan90Days.*). */
    goal: z.string().min(1).max(280),
    /** Marco de sucesso do mês — curto, verificável, pode citar um número já existente no contexto (nunca inventado). */
    milestone: z.string().min(1).max(160),
  })
  .strict();

export const PlanPhaseSummariesSchema = z
  .object({
    days1to30: PlanPhaseSummarySchema,
    days31to60: PlanPhaseSummarySchema,
    days61to90: PlanPhaseSummarySchema,
  })
  .strict();

// ─── Agenda semanal do gestor (representativa, não um calendário completo) ──
export const WeeklyAgendaItemSchema = z
  .object({
    focus: z.string().min(1).max(150),
    activities: z.array(z.string().min(1).max(150)).min(1).max(5),
  })
  .strict();

export const WeeklyManagerAgendaSchema = z.array(WeeklyAgendaItemSchema).min(1).max(6);

// ─── Indicadores ─────────────────────────────────────────────────────────────
export const IndicatorSchema = z
  .object({
    name: z.string().min(1).max(100),
    /** Texto, não número — só pode citar um valor que já existe no contexto (ver numeric-guard.ts). Null quando o valor atual não é conhecido. */
    currentValue: z
      .string()
      .max(60)
      .nullable()
      .describe(
        "Valor atual deste indicador. Use SOMENTE um número que já apareça literalmente no contexto fornecido (uma taxa, contagem ou meta já calculada). Nunca invente um número novo. Se não houver um valor correspondente no contexto, retorne null.",
      ),
    targetValue: z
      .string()
      .max(60)
      .nullable()
      .describe(
        "Meta deste indicador. Use SOMENTE um número que já apareça literalmente no contexto fornecido (ex.: um valor de requiredFunnel, uma taxa necessária, ou uma meta já calculada) — nunca proponha uma porcentagem ou número novo por conta própria. Se não houver uma meta correspondente no contexto, retorne null em vez de inventar um valor redondo.",
      ),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  })
  .strict();

// ─── CTA consultivo ──────────────────────────────────────────────────────────
export const ConsultativeCtaSchema = z
  .object({
    message: z.string().min(1).max(300),
  })
  .strict();

// ─── Dimensão do gargalo (eco do contexto — nunca decidida livremente aqui) ─
export const BottleneckDimensionSchema = z.enum([
  "demand",
  "conversion",
  "processes",
  "management",
  "scale",
  "digital_positioning",
]);

// ─── Schema principal ─────────────────────────────────────────────────────────
export const CommercialPlanSchema = z
  .object({
    executiveDiagnosis: z.string().min(1).max(600),
    primaryBottleneck: BottleneckDimensionSchema,
    secondaryRisk: BottleneckDimensionSchema.nullable(),
    evidence: z.array(EvidenceSchema).min(1).max(8),
    rootCause: RootCauseSchema,
    goalGapInterpretation: z.string().min(1).max(500),
    priorities: z.array(PrioritySchema).length(3),
    strategicSummary: StrategicSummarySchema,
    phaseSummaries: PlanPhaseSummariesSchema,
    plan90Days: CommercialPlan90DaysSchema,
    weeklyManagerAgenda: WeeklyManagerAgendaSchema,
    indicators: z.array(IndicatorSchema).min(1).max(10),
    limitations: z.array(z.string().min(1).max(300)).min(1).max(6),
    consultativeCta: ConsultativeCtaSchema,
  })
  .strict();

export type Evidence = z.infer<typeof EvidenceSchema>;
export type RootCause = z.infer<typeof RootCauseSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type BlogBrief = z.infer<typeof BlogBriefSchema>;
export type RichMaterialBrief = z.infer<typeof RichMaterialBriefSchema>;
export type PaidTrafficBrief = z.infer<typeof PaidTrafficBriefSchema>;
export type CadenceBrief = z.infer<typeof CadenceBriefSchema>;
export type CadenceChannel = z.infer<typeof CadenceChannelSchema>;
export type PlaybookBrief = z.infer<typeof PlaybookBriefSchema>;
export type LandingPageBrief = z.infer<typeof LandingPageBriefSchema>;
export type MediaChannelPriority = z.infer<typeof MediaChannelPrioritySchema>;
export type StrategicSummary = z.infer<typeof StrategicSummarySchema>;
export type PlanAction = z.infer<typeof PlanActionSchema>;
export type CommercialPlan90Days = z.infer<typeof CommercialPlan90DaysSchema>;
export type PlanPhaseSummary = z.infer<typeof PlanPhaseSummarySchema>;
export type PlanPhaseSummaries = z.infer<typeof PlanPhaseSummariesSchema>;
export type WeeklyAgendaItem = z.infer<typeof WeeklyAgendaItemSchema>;
export type Indicator = z.infer<typeof IndicatorSchema>;
export type ConsultativeCta = z.infer<typeof ConsultativeCtaSchema>;
export type CommercialPlan = z.infer<typeof CommercialPlanSchema>;
