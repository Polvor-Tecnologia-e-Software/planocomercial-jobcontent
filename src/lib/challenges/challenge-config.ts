import { Filter, Handshake, Megaphone, Rocket, SearchX, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Dimension, SelectedChallenge } from "@/types/tables";

// ==============================================================================
// ⚠️ AVISO DE PROVENIÊNCIA DO CONTEÚDO
// ==============================================================================
// Esta conversa não tem acesso ao BRD completo (23 seções + Anexo D — o
// catálogo real de sinais determinísticos, ver comentário em
// supabase/migrations/20260731100800_diagnostic_signals.sql). Por isso:
//
// - `title` de cada desafio: texto exato fornecido por quem pediu a tela.
// - `shortExplanation`, `universalQuestions` e `adaptiveQuestions`: RASCUNHO
//   escrito nesta sessão (boa prática de diagnóstico comercial B2B), NÃO
//   veio do BRD. Revisar/substituir pelo catálogo real antes de construir
//   o motor de perguntas adaptativas.
// - `probableDimension`: inferência minha a partir da descrição de cada
//   desafio — confirmar contra a seção do BRD que define isso.
// - `relatedSignals`: os códigos marcados com `source: "brd_anexo_d"__
//   ("DEPENDENCY_REFERRAL", "NO_CONVERSION_ASSET") já apareciam citados
//   como exemplo no comentário da migration de diagnostic_signals — os
//   demais, marcados `source: "draft"`, são meus e precisam ser
//   conferidos contra o Anexo D real.
// ==============================================================================

/**
 * "currency" e "date" têm a mesma persistência de "number"/"text"
 * (currency grava um número puro em reais; date grava uma string
 * "AAAA-MM-DD") — só mudam a formatação do campo de entrada. Ver
 * src/components/diagnostic/adaptive-diagnostic-journey.tsx (renderização)
 * e src/lib/challenges/adaptive-engine.ts (validação).
 */
export type QuestionType = "single_select" | "number" | "text" | "currency" | "date";

export type ChallengeQuestionOption = {
  readonly value: string;
  readonly label: string;
};

export type ChallengeQuestion = {
  /** Único em todo o catálogo (ex.: "U1", "D1_Q1") — vira `question_key` em diagnostic_answers. */
  readonly key: string;
  readonly prompt: string;
  readonly type: QuestionType;
  readonly options?: readonly ChallengeQuestionOption[];
};

/**
 * Formato original de displayRule (todas as 15 regras hoje em CHALLENGES
 * usam exatamente esta forma — nenhuma foi reescrita ao evoluir o tipo
 * abaixo). Duas semânticas conforme `whenAnswerIn`:
 * - vazio: só exige que `showAfterKey` tenha sido respondida (qualquer valor);
 * - não vazio: exige que a resposta de `showAfterKey` esteja na lista.
 * O motor (src/lib/challenges/adaptive-engine.ts) trata isso como um
 * atalho para `{ questionKey: showAfterKey, operator: "exists" | "in" }`.
 */
export type LegacyDisplayRule = {
  readonly showAfterKey: string;
  readonly whenAnswerIn: readonly string[];
};

/** Operadores com utilidade real neste catálogo (single_select/number/text) ou previstos para perguntas futuras do mesmo tipo. */
export type DisplayRuleOperator =
  | "equals"
  | "notEquals"
  | "includes"
  | "notIncludes"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "exists"
  | "notExists"
  | "in"
  | "notIn";

/** Uma condição sobre a resposta de uma única pergunta já respondida. */
export type DisplayCondition = {
  readonly questionKey: string;
  readonly operator: DisplayRuleOperator;
  /** Ausente para "exists"/"notExists", que não comparam valor. */
  readonly value?: string | number | readonly string[];
};

export type DisplayRuleGroup =
  | { readonly and: readonly DisplayRule[] }
  | { readonly or: readonly DisplayRule[] };

/**
 * Regra de exibição de uma pergunta adaptativa: o formato legado (usado
 * por todo o catálogo atual), uma condição única mais expressiva, ou uma
 * combinação AND/OR de sub-regras (para o catálogo evoluir sem exigir
 * reescrever as regras existentes).
 */
export type DisplayRule = LegacyDisplayRule | DisplayCondition | DisplayRuleGroup;

export type AdaptiveChallengeQuestion = ChallengeQuestion & {
  /**
   * Regra de exibição: só entra na rota se avaliar como verdadeira. A
   * avaliação de fato (ler as respostas e decidir) é responsabilidade do
   * motor de perguntas adaptativas (src/lib/challenges/adaptive-engine.ts)
   * — aqui só declaramos a regra.
   */
  readonly displayRule: DisplayRule;
};

export type ChallengeSignal = {
  /** Código curto (Anexo D), ex.: "NO_CONVERSION_ASSET". */
  readonly key: string;
  readonly label: string;
  readonly source: "site_analysis" | "crm_field_mapping" | "answer";
  /** Se este código já é confirmado pelo BRD/Anexo D, ou rascunho desta sessão. */
  readonly provenance: "brd_anexo_d" | "draft";
};

export type ChallengeDefinition = {
  readonly code: SelectedChallenge;
  readonly title: string;
  readonly shortExplanation: string;
  readonly icon: LucideIcon;
  readonly probableDimension: Dimension;
  readonly universalQuestions: readonly ChallengeQuestion[];
  readonly adaptiveQuestions: readonly AdaptiveChallengeQuestion[];
  readonly relatedSignals: readonly ChallengeSignal[];
};

/**
 * Perguntas universais (seção "U" do BRD): as mesmas para qualquer
 * desafio escolhido. Espelham dois campos que já existem em
 * `companies` (average_ticket, sales_cycle) mais o tamanho da equipe
 * comercial ativa.
 *
 * U4-U9 (meta mensal, vendas atuais e volume de cada etapa do funil)
 * foram adicionadas depois das três primeiras, numa etapa posterior —
 * sem elas, o motor de engenharia reversa (src/lib/calculations/reverse-engineering.ts)
 * nunca tinha os dois dados mínimos (meta + ticket médio) para calcular
 * "necessário", e o Mapa de Vazamento Comercial nunca tinha volume "atual"
 * de nenhuma etapa além da que o desafio escolhido perguntava por conta
 * própria — na prática, o funil quase nunca calculava nada de verdade.
 * Universais (não perguntas específicas de um desafio) de propósito: o
 * funil completo é útil independente de qual sintoma a pessoa escolheu
 * relatar primeiro.
 *
 * U1/U4/U5 (redação revisada após teste real, feedback do Jean): a
 * pessoa respondendo pode confundir período (anual x mensal) e confundir
 * "situação atual" com "meta desejada" — um ticket médio ANUAL respondido
 * onde o motor espera um valor por venda distorce toda a engenharia
 * reversa (requiredCustomers = monthlyGoal / averageTicket vira um número
 * artificialmente baixo). Por isso U1 agora deixa explícito que é o valor
 * de UMA venda, U4 reforça "MENSAL" em caixa alta, e U5 deixa claro que é
 * a situação de HOJE, não a meta (que já foi perguntada em U4).
 *
 * U10 (faturamento mensal atual): sem ela, a engenharia reversa
 * (reverse-engineering.ts) trata monthlyGoal como se a empresa partisse
 * de R$0, mesmo que já exista faturamento — o que infla artificialmente
 * "clientes necessários" para qualquer empresa com receita recorrente
 * (contratos já fechados, assinaturas) que não vem das vendas novas do
 * mês (U5). Opcional: se não respondida, o motor cai de volta no
 * comportamento antigo (meta tratada a partir de zero), sem regressão.
 *
 * U11 (maturidade de CRM): antes dela, "usa CRM?"/"está estruturado?" só
 * eram perguntados de forma fragmentada e condicional a um desafio
 * específico (D1_Q3 só se D1+"não sei"; D3_Q3 só em D3; D5_Q1/Q3 só em D5;
 * D6_Q2 só em D6) — quem escolhia D2 ou D4, por exemplo, nunca respondia
 * nada sobre CRM. Isso é um problema real: o motor sempre exige pelo
 * menos 1 ação "crm_pipeline" por fase do plano de 90 dias (ver
 * COMMERCIAL_ACTIONS_BLOCK em commercial-plan-prompt.ts), mas sem saber
 * se a empresa TEM CRM, a IA podia recomendar "definir critério de
 * estágio no CRM" pra uma empresa sem CRM nenhum. U11 alimenta os sinais
 * NO_CRM/UNSTRUCTURED_CRM (src/lib/calculations/signals.ts), que disparam
 * independente do desafio escolhido — mesmo padrão já usado por
 * LOW_NEW_LEADS_VOLUME (baseado em U6).
 */
export const UNIVERSAL_QUESTIONS: readonly ChallengeQuestion[] = [
  {
    key: "U1",
    prompt:
      "Qual é o ticket médio de uma venda fechada? (o valor de UMA venda — não o faturamento do mês nem do ano)",
    type: "currency",
  },
  {
    key: "U2",
    prompt: "Qual é o ciclo médio de vendas, da primeira conversa ao fechamento (em dias)?",
    type: "number",
  },
  {
    key: "U3",
    prompt: "Quantas pessoas hoje atuam ativamente vendendo (SDR + closers)?",
    type: "number",
  },
  {
    key: "U4",
    prompt: "Qual é a meta de faturamento MENSAL da empresa? (quanto vocês querem faturar por mês)",
    type: "currency",
  },
  {
    key: "U5",
    prompt:
      "HOJE, sem contar a meta: quantas vendas (novos clientes fechados) a empresa faz por mês, em média?",
    type: "number",
  },
  {
    key: "U10",
    prompt:
      "Qual é o faturamento MENSAL ATUAL da empresa? (o que vocês faturam hoje — não a meta que você respondeu antes)",
    type: "currency",
  },
  {
    key: "U6",
    prompt: "Quantos leads novos entram por mês, em média?",
    type: "number",
  },
  {
    key: "U7",
    prompt: "Quantas oportunidades comerciais reais (negociações em andamento) você tem por mês, em média?",
    type: "number",
  },
  {
    key: "U8",
    prompt: "Quantas reuniões ou calls comerciais acontecem por mês, em média?",
    type: "number",
  },
  {
    key: "U9",
    prompt: "Quantas propostas ou orçamentos são enviados por mês, em média?",
    type: "number",
  },
  {
    key: "U11",
    prompt:
      "Vocês usam algum CRM (mesmo simples, como HubSpot, Pipedrive, RD Station CRM, Salesforce etc.) para gerenciar leads e oportunidades?",
    type: "single_select",
    options: [
      { value: "nao", label: "Não, não usamos" },
      { value: "usa_desorganizado", label: "Usamos, mas está desorganizado ou pouco usado pela equipe" },
      { value: "usa_estruturado", label: "Usamos e está bem estruturado (etapas definidas, dados preenchidos)" },
    ],
  },
] as const;

export const CHALLENGE_ORDER: readonly SelectedChallenge[] = [
  "D1",
  "D2",
  "D3",
  "D4",
  "D5",
  "D6",
] as const;

export const CHALLENGES: Record<SelectedChallenge, ChallengeDefinition> = {
  D1: {
    code: "D1",
    title: "Precisamos gerar mais oportunidades",
    shortExplanation: "O funil está vazio: poucos leads ou contatos novos chegando.",
    icon: Megaphone,
    probableDimension: "demand",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D1_Q1",
        prompt: "De onde vêm a maioria dos leads hoje?",
        type: "single_select",
        options: [
          { value: "indicacao", label: "Indicação" },
          { value: "outbound", label: "Outbound (prospecção ativa)" },
          { value: "inbound", label: "Inbound / Marketing digital" },
          { value: "eventos", label: "Eventos e networking" },
          { value: "nao_sei", label: "Não sei dizer" },
        ],
        displayRule: { showAfterKey: "U1", whenAnswerIn: [] },
      },
      // D1_Q2 ("quantos leads novos entram por mês") foi removida: ficou
      // redundante com a pergunta universal U6, que pergunta exatamente
      // isso para todo mundo agora (não só para quem escolhe D1).
      {
        key: "D1_Q3",
        prompt: "Existe algum registro (CRM ou planilha) de onde os leads vêm?",
        type: "single_select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
        ],
        displayRule: { showAfterKey: "D1_Q1", whenAnswerIn: ["nao_sei"] },
      },
    ],
    relatedSignals: [
      {
        key: "DEPENDENCY_REFERRAL",
        label: "Dependência forte de indicação como canal de geração",
        source: "answer",
        provenance: "brd_anexo_d",
      },
      {
        key: "LOW_NEW_LEADS_VOLUME",
        label: "Volume mensal de novos leads abaixo do esperado para o porte",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "UNCLEAR_ACQUISITION_CHANNEL",
        label: "Sem clareza de qual canal realmente traz leads",
        source: "crm_field_mapping",
        provenance: "draft",
      },
    ],
  },

  D2: {
    code: "D2",
    title: "Geramos leads, mas poucos avançam",
    shortExplanation: "Os leads chegam, mas travam antes de virar oportunidade real.",
    icon: Filter,
    probableDimension: "conversion",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D2_Q1",
        prompt: "Existe um critério claro de qualificação de leads (MQL/SQL)?",
        type: "single_select",
        options: [
          { value: "sim", label: "Sim, e é seguido" },
          { value: "existe_nao_seguido", label: "Existe, mas não é seguido" },
          { value: "nao", label: "Não existe" },
        ],
        displayRule: { showAfterKey: "U1", whenAnswerIn: [] },
      },
      {
        key: "D2_Q2",
        prompt: "Qual a taxa aproximada de leads que viram oportunidade real?",
        type: "single_select",
        options: [
          { value: "menos_10", label: "Menos de 10%" },
          { value: "10_30", label: "Entre 10% e 30%" },
          { value: "30_50", label: "Entre 30% e 50%" },
          { value: "mais_50", label: "Mais de 50%" },
          { value: "nao_sei", label: "Não sei" },
        ],
        displayRule: { showAfterKey: "D2_Q1", whenAnswerIn: [] },
      },
      {
        key: "D2_Q3",
        prompt: "O que mais atrapalha seguir esse critério de qualificação?",
        type: "text",
        displayRule: { showAfterKey: "D2_Q1", whenAnswerIn: ["existe_nao_seguido"] },
      },
    ],
    relatedSignals: [
      {
        key: "NO_CONVERSION_ASSET",
        label: "Poucos ativos de conversão identificados (formulários, ofertas, CTAs)",
        source: "site_analysis",
        provenance: "brd_anexo_d",
      },
      {
        key: "NO_MQL_CRITERIA",
        label: "Ausência (ou não adoção) de critério de qualificação",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "HIGH_MQL_NO_SQL",
        label: "Muitos leads qualificados por marketing, poucos por vendas",
        source: "crm_field_mapping",
        provenance: "draft",
      },
    ],
  },

  D3: {
    code: "D3",
    title: "Temos propostas, mas fechamos pouco",
    shortExplanation: "As negociações avançam, só que travam na hora de fechar.",
    icon: Handshake,
    probableDimension: "conversion",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D3_Q1",
        prompt: "Qual o principal motivo de perda hoje?",
        type: "single_select",
        options: [
          { value: "preco", label: "Preço" },
          { value: "concorrencia", label: "Concorrência" },
          { value: "timing", label: "Timing do cliente" },
          { value: "falta_followup", label: "Falta de follow-up" },
          { value: "nao_sabemos", label: "Não sabemos" },
        ],
        displayRule: { showAfterKey: "U1", whenAnswerIn: [] },
      },
      {
        key: "D3_Q2",
        prompt: "Quanto tempo, em média, uma proposta fica parada até fechar ou perder (dias)?",
        type: "number",
        displayRule: { showAfterKey: "D3_Q1", whenAnswerIn: [] },
      },
      {
        key: "D3_Q3",
        prompt: "Existe registro do motivo de perda no CRM?",
        type: "single_select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
        ],
        displayRule: { showAfterKey: "D3_Q1", whenAnswerIn: ["nao_sabemos"] },
      },
    ],
    relatedSignals: [
      {
        key: "STALLED_PROPOSALS",
        label: "Propostas paradas por muito tempo na etapa de negociação",
        source: "crm_field_mapping",
        provenance: "draft",
      },
      {
        key: "NO_LOSS_REASON_TRACKING",
        label: "Sem registro estruturado do motivo de perda",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "LOW_COMMERCIAL_PROOF",
        label: "Poucas provas comerciais (cases, depoimentos) no site",
        source: "site_analysis",
        provenance: "draft",
      },
    ],
  },

  D4: {
    code: "D4",
    title: "O processo depende demais dos vendedores",
    shortExplanation: "O resultado varia muito de pessoa para pessoa, sem um padrão.",
    icon: UserCog,
    probableDimension: "processes",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D4_Q1",
        prompt: "Existe um processo comercial documentado (playbook)?",
        type: "single_select",
        options: [
          { value: "sim", label: "Sim, e é seguido" },
          { value: "existe_nao_seguido", label: "Existe, mas não é seguido" },
          { value: "nao", label: "Não existe" },
        ],
        displayRule: { showAfterKey: "U3", whenAnswerIn: [] },
      },
      {
        key: "D4_Q2",
        prompt:
          "O que aconteceria com o resultado comercial se o principal vendedor saísse amanhã?",
        type: "single_select",
        options: [
          { value: "pouco_impacto", label: "Pouco impacto" },
          { value: "impacto_moderado", label: "Impacto moderado" },
          { value: "impacto_grave", label: "Impacto grave" },
        ],
        displayRule: { showAfterKey: "D4_Q1", whenAnswerIn: [] },
      },
      {
        key: "D4_Q3",
        prompt: "O que mais dificulta padronizar o processo comercial?",
        type: "text",
        displayRule: {
          showAfterKey: "D4_Q1",
          whenAnswerIn: ["existe_nao_seguido", "nao"],
        },
      },
    ],
    relatedSignals: [
      {
        key: "NO_SALES_PLAYBOOK",
        label: "Ausência (ou não adoção) de processo comercial documentado",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "REP_DEPENDENCY",
        label: "Resultado comercial concentrado em uma ou poucas pessoas",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "LOW_CRM_ADOPTION",
        label: "Baixa adoção do CRM pela equipe comercial",
        source: "crm_field_mapping",
        provenance: "draft",
      },
    ],
  },

  D5: {
    code: "D5",
    title: "Não sabemos onde estamos perdendo vendas",
    shortExplanation: "Falta visibilidade clara de onde o funil vaza.",
    icon: SearchX,
    probableDimension: "management",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D5_Q1",
        prompt: "Existe um relatório (dashboard ou planilha) do funil de vendas atualizado?",
        type: "single_select",
        options: [
          { value: "sim_atualizado", label: "Sim, atualizado" },
          { value: "existe_desatualizado", label: "Existe, mas desatualizado" },
          { value: "nao", label: "Não existe" },
        ],
        displayRule: { showAfterKey: "U2", whenAnswerIn: [] },
      },
      {
        key: "D5_Q2",
        prompt: "Quem hoje sabe dizer, com confiança, quantas oportunidades estão em cada etapa?",
        type: "single_select",
        options: [
          { value: "qualquer_um", label: "Qualquer um do time" },
          { value: "so_lideranca", label: "Só a liderança" },
          { value: "ninguem", label: "Ninguém, com certeza" },
        ],
        displayRule: { showAfterKey: "D5_Q1", whenAnswerIn: [] },
      },
      {
        key: "D5_Q3",
        prompt: "O funil é gerenciado em CRM, planilha, ou de forma informal?",
        type: "single_select",
        options: [
          { value: "crm", label: "CRM" },
          { value: "planilha", label: "Planilha" },
          { value: "informal", label: "Informal / de memória" },
        ],
        displayRule: {
          showAfterKey: "D5_Q1",
          whenAnswerIn: ["existe_desatualizado", "nao"],
        },
      },
    ],
    relatedSignals: [
      {
        key: "NO_PIPELINE_VISIBILITY",
        label: "Sem visibilidade confiável das etapas do funil",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "STALE_FUNNEL_DATA",
        label: "Dados do funil desatualizados ou incompletos no CRM",
        source: "crm_field_mapping",
        provenance: "draft",
      },
      // NO_CRM/UNSTRUCTURED_CRM: baseados em U11 (universal), disparam
      // independente do desafio escolhido — catalogados aqui em D5
      // (gestão) por ser o lar mais natural, mesmo padrão já usado por
      // LOW_NEW_LEADS_VOLUME em D1 (ver comentário de U11 acima).
      {
        key: "NO_CRM",
        label: "Empresa não usa nenhum CRM para gerenciar leads e oportunidades",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "UNSTRUCTURED_CRM",
        label: "CRM existe mas está desorganizado ou pouco usado pela equipe",
        source: "answer",
        provenance: "draft",
      },
    ],
  },

  D6: {
    code: "D6",
    title: "Queremos crescer sem aumentar a equipe",
    shortExplanation: "Precisa vender mais sem inflar o time comercial.",
    icon: Rocket,
    probableDimension: "scale",
    universalQuestions: UNIVERSAL_QUESTIONS,
    adaptiveQuestions: [
      {
        key: "D6_Q1",
        prompt: "Hoje, quanto do trabalho comercial é manual (planilhas, follow-up manual etc.)?",
        type: "single_select",
        options: [
          { value: "quase_tudo_manual", label: "Quase tudo manual" },
          { value: "metade_metade", label: "Metade e metade" },
          { value: "bem_automatizado", label: "Já é bem automatizado" },
        ],
        displayRule: { showAfterKey: "U3", whenAnswerIn: [] },
      },
      {
        key: "D6_Q2",
        prompt: "Existe alguma ferramenta de automação de marketing/vendas em uso?",
        type: "single_select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
          { value: "parou_de_usar", label: "Já teve, mas parou de usar" },
        ],
        displayRule: { showAfterKey: "D6_Q1", whenAnswerIn: [] },
      },
      {
        key: "D6_Q3",
        prompt: "Qual tarefa manual mais consome tempo do time hoje?",
        type: "text",
        displayRule: { showAfterKey: "D6_Q1", whenAnswerIn: ["quase_tudo_manual"] },
      },
    ],
    relatedSignals: [
      {
        key: "LOW_AUTOMATION",
        label: "Baixo nível de automação de tarefas comerciais repetitivas",
        source: "answer",
        provenance: "draft",
      },
      {
        key: "MANUAL_HEAVY_PROCESS",
        label: "Processo fortemente dependente de trabalho manual",
        source: "crm_field_mapping",
        provenance: "draft",
      },
    ],
  },
} as const;

export type QuestionRouteItem = {
  readonly question: ChallengeQuestion | AdaptiveChallengeQuestion;
  readonly adaptive: boolean;
};

/**
 * Rota determinística de perguntas para um desafio: universais primeiro,
 * depois as adaptativas do desafio, na ordem declarada em CHALLENGES.
 * Função pura — mesma entrada sempre produz a mesma saída, sem IA e sem
 * efeitos colaterais. A avaliação de quais adaptativas de fato aparecem
 * (conforme `displayRule`) é responsabilidade do motor de perguntas
 * adaptativas (próxima etapa); aqui só se define a rota candidata.
 */
export function getDeterministicQuestionRoute(
  code: SelectedChallenge,
): readonly QuestionRouteItem[] {
  const definition = CHALLENGES[code];

  return [
    ...definition.universalQuestions.map((question) => ({ question, adaptive: false })),
    ...definition.adaptiveQuestions.map((question) => ({ question, adaptive: true })),
  ];
}
