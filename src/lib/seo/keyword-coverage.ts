/**
 * Marca, de forma determinística (nunca a IA), quais oportunidades de
 * palavra-chave o site da empresa aparentemente ainda NÃO cobre — a
 * "palavra-chave de nicho que a empresa está perdendo" pedida pelo
 * usuário. Nunca inventa a lacuna: só compara texto contra texto.
 *
 * Heurística (documentada de propósito, para não parecer mágica):
 * considera uma palavra-chave "coberta" quando TODAS as suas palavras
 * significativas (sem contar preposições/artigos comuns) aparecem em
 * algum lugar do perfil confirmado da empresa (descrição, oferta
 * principal, público-alvo, diferenciais, provas comerciais). Não exige
 * que as palavras estejam juntas/na mesma ordem, e não faz stemming
 * (singular/plural, variações verbais) — é um sinal aproximado, não uma
 * auditoria de SEO completa.
 */

import type { RankedKeywordOpportunity } from "@/lib/seo/keyword-opportunity";

export type KeywordOpportunity = RankedKeywordOpportunity & {
  /** true quando o perfil da empresa não parece cobrir esse termo ainda. */
  coverageGap: boolean;
};

const STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "a",
  "o",
  "as",
  "os",
  "em",
  "para",
  "com",
  "por",
  "um",
  "uma",
  "no",
  "na",
  "nos",
  "nas",
  "que",
  "ao",
  "aos",
]);

/** Remove acentos (á -> a) via decomposição Unicode, para comparar termos com/sem acento como iguais. */
function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function significantWords(text: string): string[] {
  return stripAccents(text.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Compara as palavras-chave já ranqueadas (src/lib/seo/keyword-opportunity.ts)
 * contra o texto do perfil da empresa e adiciona `coverageGap` a cada uma.
 */
export function flagCoverageGaps(
  opportunities: readonly RankedKeywordOpportunity[],
  siteContentText: string,
): KeywordOpportunity[] {
  const contentWords = new Set(significantWords(siteContentText));

  return opportunities.map((opportunity) => {
    const keywordWords = significantWords(opportunity.keyword);
    const covered = keywordWords.length > 0 && keywordWords.every((word) => contentWords.has(word));
    return { ...opportunity, coverageGap: !covered };
  });
}
