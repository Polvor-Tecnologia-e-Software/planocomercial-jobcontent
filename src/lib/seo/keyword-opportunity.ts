/**
 * Ranqueamento determinístico de oportunidades de SEO — a ordenação em
 * si nunca é feita pela IA, sempre por esta fórmula fixa e auditável.
 *
 * Recebe ideias de palavra-chave já com volume médio de busca mensal e
 * nível de concorrência — hoje geradas por IA como estimativa (ver
 * src/lib/ai/seo-keywords.ts; a interface rotula isso como estimativa,
 * nunca como dado real do Google) — e ordena priorizando volume alto
 * combinado com concorrência baixa/média. Nunca aplica um "score oculto"
 * de mercado — o peso de cada nível de concorrência está aqui, visível.
 */

export type Competition = "low" | "medium" | "high" | "unknown";

export type KeywordIdea = {
  keyword: string;
  /** null quando não há estimativa de volume disponível para esta palavra. */
  avgMonthlySearches: number | null;
  competition: Competition;
};

export type RankedKeywordOpportunity = KeywordIdea & {
  /** 1 = melhor oportunidade. */
  opportunityRank: number;
};

/**
 * Peso por nível de concorrência — concorrência baixa pesa mais porque é
 * mais fácil ranquear organicamente; "unknown" nunca é tratado como
 * favorável (peso 0), para nunca promover um dado incompleto acima de um
 * dado completo.
 */
const COMPETITION_WEIGHT: Record<Competition, number> = {
  low: 3,
  medium: 2,
  high: 1,
  unknown: 0,
};

/** Quantas oportunidades aparecem no plano/PDF — evita uma lista longa demais para leitura executiva. */
export const MAX_KEYWORD_OPPORTUNITIES = 10;

/**
 * Ordena por (volume × peso da concorrência), decrescente. Descarta
 * palavras sem nenhum volume de busca conhecido (não há "oportunidade"
 * mensurável ali) e sem concorrência conhecida ao mesmo tempo — mas
 * mantém uma palavra com volume mesmo que a concorrência seja
 * desconhecida (ainda é informação real, só menos completa).
 */
export function rankKeywordOpportunities(ideas: readonly KeywordIdea[]): RankedKeywordOpportunity[] {
  return ideas
    .filter((idea) => idea.avgMonthlySearches !== null && idea.avgMonthlySearches > 0)
    .map((idea) => ({
      ...idea,
      score: (idea.avgMonthlySearches ?? 0) * COMPETITION_WEIGHT[idea.competition],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_KEYWORD_OPPORTUNITIES)
    .map(({ score: _score, ...idea }, index) => ({ ...idea, opportunityRank: index + 1 }));
}
