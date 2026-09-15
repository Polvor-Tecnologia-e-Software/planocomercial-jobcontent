import { z } from "zod";

/**
 * Saída estruturada da sugestão de palavras-chave por IA
 * (src/lib/ai/seo-keywords.ts). Substitui a integração com o Google Ads
 * Keyword Planner (ver docs/CHECKLIST-GOOGLE-ADS.md, descontinuado) —
 * aqui o volume de busca e a concorrência são ESTIMATIVAS da IA, nunca
 * dado real do Google. Por isso a interface (src/components/result/seo-opportunities-section.tsx)
 * rotula tudo como estimativa, e o schema é estrito (".strict()") para a
 * IA nunca devolver um campo a mais que passe despercebido.
 */
export const seoKeywordSuggestionSchema = z
  .object({
    keyword: z.string().min(1).max(80),
    /** Estimativa de buscas mensais no Brasil — sempre um palpite da IA, nunca um número real do Google. */
    estimatedMonthlySearches: z.number().int().min(0),
    competition: z.enum(["low", "medium", "high"]),
  })
  .strict();

export const seoKeywordSuggestionsResultSchema = z
  .object({
    suggestions: z.array(seoKeywordSuggestionSchema).min(1).max(10),
  })
  .strict();

export type SeoKeywordSuggestion = z.infer<typeof seoKeywordSuggestionSchema>;
export type SeoKeywordSuggestionsResult = z.infer<typeof seoKeywordSuggestionsResultSchema>;
