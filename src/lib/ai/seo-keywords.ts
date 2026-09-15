import "server-only";

import { generateStructuredJson } from "@/lib/ai/client";
import {
  buildSeoKeywordsUserPrompt,
  SEO_KEYWORDS_PROMPT_VERSION,
  SEO_KEYWORDS_SYSTEM_PROMPT,
  SEO_KEYWORDS_TOOL_DESCRIPTION,
  SEO_KEYWORDS_TOOL_NAME,
} from "@/lib/ai/seo-keywords-prompt";
import {
  seoKeywordSuggestionsResultSchema,
  type SeoKeywordSuggestion,
} from "@/lib/ai/seo-keywords-schema";

export type SeoKeywordsAiCall = {
  suggestions: SeoKeywordSuggestion[];
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  promptVersion: string;
};

/**
 * Função de chamada da IA para sugerir palavras-chave de SEO — substitui
 * a integração com o Google Ads Keyword Planner. `strict: true` porque o
 * schema não tem nenhum campo `.optional()`/`.default()` (já conferido).
 * Lança AiResponseValidationError (ver src/lib/ai/errors.ts) quando a IA
 * não retorna um resultado válido — o chamador decide o que fazer (ver
 * src/server/analyze-seo-opportunities.ts).
 */
export async function generateSeoKeywordSuggestions(params: {
  seedKeywords: string[];
  companyProfileText: string;
}): Promise<SeoKeywordsAiCall> {
  const callResult = await generateStructuredJson({
    system: SEO_KEYWORDS_SYSTEM_PROMPT,
    userPrompt: buildSeoKeywordsUserPrompt(params),
    schema: seoKeywordSuggestionsResultSchema,
    toolName: SEO_KEYWORDS_TOOL_NAME,
    toolDescription: SEO_KEYWORDS_TOOL_DESCRIPTION,
    maxTokens: 800,
    strict: true,
  });

  return {
    suggestions: callResult.data.suggestions,
    inputTokens: callResult.inputTokens,
    outputTokens: callResult.outputTokens,
    model: callResult.model,
    latencyMs: callResult.latencyMs,
    promptVersion: SEO_KEYWORDS_PROMPT_VERSION,
  };
}
