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
     * resumo de uma linha. `body` é o texto de apoio de UM parágrafo
     * (não o artigo inteiro), na voz e argumentos que o post usaria.
     * Quando a cadência subiu de 2 pra 4 posts/fase (pedido explícito),
     * esses limites foram temporariamente reduzidos (2-3 seções, 450
     * chars) pra caber no teto de saída do gpt-4o-mini (~16k tokens) — o
     * modelo foi trocado pra gpt-4.1-mini (teto de ~32k, ver AI_MODEL em
     * .env.local e comentário em src/lib/ai/commercial-plan.ts) e os
     * limites voltaram ao tamanho original.
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
    headline: z.string().min(1).max(120),
    subheadline: z.string().min(1).max(160),
  })
  .strict();

export const CadenceBriefSchema = z
  .object({
    /**
     * 2 a 5 toques de uma cadência de follow-up (ex.: D+2, D+5, D+10) —
     * cada um com o CANAL (e-mail, WhatsApp, ligação) e a COPY real da
     * mensagem pra aquele toque, não só a descrição da cadência (isso já
     * existe em `details`, ex.: "follow-up em D+2, D+5 e D+10"). Pedido
     * explícito: quem recebe o plano precisa de algo pronto pra usar, não
     * só a estrutura da cadência.
     */
    touchpoints: z
      .array(
        z
          .object({
            /** Ex.: "D+2", "D+5", "D+10" — o momento do toque em relação ao evento que dispara a cadência (proposta enviada, lead sem resposta etc.). */
            moment: z.string().min(1).max(30),
            /** Ex.: "E-mail", "WhatsApp", "Ligação", "LinkedIn". */
            channel: z.string().min(1).max(40),
            /** A mensagem real desse toque, pronta pra adaptar e enviar — pode usar placeholders genéricos como "[Nome]" já que o contexto não tem o nome do destinatário. */
            copy: z.string().min(1).max(500),
          })
          .strict(),
      )
      .min(2)
      .max(5),
  })
  .strict();

// ─── Plano de 90 dias (3 fases, até 5 ações cada) ────────────────────────────
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
     * Copy completo dos toques de uma cadência de follow-up — só pode vir
     * preenchido quando actionType é "crm_pipeline" E a ação é de fato
     * uma cadência com múltiplos toques ao longo do tempo (não quando
     * "crm_pipeline" é usado pra outra coisa, como critério de
     * entrada/saída de estágio, que não tem "toques" pra detalhar); null
     * em qualquer outro caso.
     */
    cadenceBrief: CadenceBriefSchema.nullable(),
    suggestedOwner: z.string().min(1).max(60),
    deadline: z.string().min(1).max(50),
    indicator: z.string().min(1).max(150),
    completionCriteria: z.string().min(1).max(250),
    /** Índice (1-3) da prioridade em `priorities` a que esta ação se conecta. */
    relatedPriority: z.number().int().min(1).max(3),
  })
  .strict();

/**
 * Máximo 5 por fase. Chegou a subir pra 7 quando a cadência de conteúdo
 * exigia 4 content_blog + 1 rich_material POR FASE — revertido pra 5
 * quando a cadência virou "2 content_blog + 1 rich_material pro plano
 * INTEIRO" (pedido explícito), que não pressiona mais o número de ações
 * por fase (ver CONTENT_CADENCE_BLOCK em commercial-plan-prompt.ts).
 */
export const PlanPhaseSchema = z.array(PlanActionSchema).min(1).max(5);

export const CommercialPlan90DaysSchema = z
  .object({
    days1to30: PlanPhaseSchema,
    days31to60: PlanPhaseSchema,
    days61to90: PlanPhaseSchema,
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
export type PlanAction = z.infer<typeof PlanActionSchema>;
export type CommercialPlan90Days = z.infer<typeof CommercialPlan90DaysSchema>;
export type WeeklyAgendaItem = z.infer<typeof WeeklyAgendaItemSchema>;
export type Indicator = z.infer<typeof IndicatorSchema>;
export type ConsultativeCta = z.infer<typeof ConsultativeCtaSchema>;
export type CommercialPlan = z.infer<typeof CommercialPlanSchema>;
