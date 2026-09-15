/**
 * Configuração do motor de cálculos: pesos, tabela de pontuação e
 * limiares. Centralizado e nomeado para ser fácil de ajustar sem caçar
 * números mágicos espalhados pela engine — e para deixar claro, para
 * quem revisar, exatamente quais heurísticas foram usadas.
 */
import type { Dimension } from "@/types/tables";

export const ALL_DIMENSIONS: readonly Dimension[] = [
  "demand",
  "conversion",
  "processes",
  "management",
  "scale",
  "digital_positioning",
];

// ─── Respostas de incerteza ───────────────────────────────────────────────
// O catálogo (src/lib/challenges/challenge-config.ts) usa códigos
// diferentes para "não sei" em perguntas diferentes (D1_Q1/D2_Q2 usam
// "nao_sei", D3_Q1 usa "nao_sabemos") — inconsistência do catálogo
// existente que não alteramos aqui, só compensamos com este conjunto.
// Adicione novos códigos aqui se o catálogo ganhar mais variações.
export const UNCERTAIN_ANSWER_VALUES = new Set<string>(["nao_sei", "nao_sabemos"]);

// ─── Estimativa de taxa a partir de faixa autodeclarada (D2_Q2) ────────────
// Ponto médio da faixa declarada — não é um benchmark do mercado, é uma
// leitura direta da própria resposta da pessoa. Faixas fechadas usam o
// meio exato; as duas faixas abertas (menos_10, mais_50) assumem uma
// largura de 10-20 pontos simétrica às faixas vizinhas, documentado aqui
// para ser auditável.
export const RATE_BUCKET_MIDPOINTS: Record<string, number> = {
  menos_10: 0.05, // assume faixa implícita [0, 10)
  "10_30": 0.2,
  "30_50": 0.4,
  mais_50: 0.6, // assume faixa implícita [50, 70), mesma largura da faixa anterior
};

// ─── Limiares de sinais (heurísticas declaradas, não benchmarks ocultos) ───
export const SIGNAL_THRESHOLDS = {
  /** Abaixo disso, U6 (leads/mês) aciona LOW_NEW_LEADS_VOLUME. */
  LOW_LEADS_PER_MONTH: 20,
  /** Acima disso, D3_Q2 (dias de proposta parada) aciona STALLED_PROPOSALS. */
  STALLED_PROPOSAL_DAYS: 30,
} as const;

// ─── Pesos por dimensão (score geral = média ponderada das dimensões com dados) ───
export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  demand: 1,
  conversion: 1,
  processes: 1,
  management: 1,
  scale: 1,
  digital_positioning: 1,
};

// ─── Tabela de pontuação (0-100, maior = mais saudável) ────────────────────
// Só perguntas de seleção única entram aqui — perguntas numéricas abertas
// (leads/mês, dias de ciclo, tamanho de equipe) não são pontuadas: não há
// como definir "bom" ou "ruim" para um número aberto sem aplicar um
// benchmark de mercado, que a especificação desta etapa proíbe. Perguntas
// de texto livre também não são pontuadas (não há como quantificar
// deterministicamente sem IA).
//
// Respostas de incerteza (UNCERTAIN_ANSWER_VALUES) nunca aparecem aqui —
// são tratadas como neutras (50) no momento da pontuação, uma única vez,
// nunca penalizadas duas vezes.
export const SELECT_QUESTION_SCORE_TABLE: Record<string, Record<string, number>> = {
  // D1 — demanda
  D1_Q1: { indicacao: 40, outbound: 70, inbound: 80, eventos: 60 },
  D1_Q3: { sim: 70, nao: 30 },

  // D2 — conversão
  D2_Q1: { sim: 90, existe_nao_seguido: 50, nao: 20 },
  D2_Q2: { menos_10: 20, "10_30": 50, "30_50": 75, mais_50: 95 },

  // D3 — conversão
  D3_Q1: { preco: 50, concorrencia: 55, timing: 60, falta_followup: 25 },
  D3_Q3: { sim: 70, nao: 30 },

  // D4 — processos
  D4_Q1: { sim: 90, existe_nao_seguido: 50, nao: 15 },
  D4_Q2: { pouco_impacto: 85, impacto_moderado: 50, impacto_grave: 15 },

  // D5 — gestão
  D5_Q1: { sim_atualizado: 90, existe_desatualizado: 45, nao: 10 },
  D5_Q2: { qualquer_um: 85, so_lideranca: 45, ninguem: 10 },
  D5_Q3: { crm: 80, planilha: 45, informal: 15 },

  // D6 — escala
  D6_Q1: { quase_tudo_manual: 15, metade_metade: 50, bem_automatizado: 90 },
  D6_Q2: { sim: 85, nao: 20, parou_de_usar: 30 },
};

/** Pontuação neutra usada quando uma resposta é de incerteza, ou quando uma dimensão não tem nenhuma pergunta respondida. */
export const NEUTRAL_SCORE = 50;

// ─── Identificação de gargalo ───────────────────────────────────────────────
export const BOTTLENECK = {
  /** Pesos de severidade ao somar o impacto de sinais de uma dimensão. */
  SEVERITY_WEIGHT: { low: 1, medium: 2, high: 3 } as const,
  /** Impacto mínimo para uma dimensão ser considerada um candidato real a gargalo — abaixo disso, os dados não confirmam um problema claro. */
  MIN_IMPACT_TO_QUALIFY: 30,
  /** Multiplicador aplicado à soma de severidade dos sinais ao somar ao impacto (100 - score de saúde). */
  SIGNAL_IMPACT_MULTIPLIER: 10,
} as const;

// ─── Qualidade de dados ──────────────────────────────────────────────────────
export const DATA_QUALITY_WEIGHTS = {
  /** Perguntas aplicáveis respondidas / total aplicável. */
  completeness: 0.4,
  /** Respostas que não são de incerteza / total respondido. */
  certainty: 0.25,
  /** Métricas críticas presentes / total de métricas críticas. */
  criticalMetrics: 0.15,
  /** Completude do funil (quantos estágios da engenharia reversa puderam ser calculados). */
  funnelCompleteness: 0.2,
} as const;

export const DATA_QUALITY_CONFIDENCE_BANDS = {
  high: 80,
  medium: 50,
} as const;

/** Chaves de pergunta tratadas como "métricas críticas" para qualidade de dados — ticket médio (U1) e meta mensal (U4), a base de todo o cálculo de engenharia reversa (sem qualquer um dos dois, a cadeia inteira fica indisponível). Tipada como readonly string[] (não um tuple `as const`) de propósito, para que checagens de .length continuem válidas mesmo se a lista crescer. */
export const CRITICAL_METRIC_QUESTION_KEYS: readonly string[] = ["U1", "U4"];
