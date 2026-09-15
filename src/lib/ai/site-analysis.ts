import "server-only";

import { generateStructuredJson } from "@/lib/ai/client";
import {
  buildSiteAnalysisUserPrompt,
  SITE_ANALYSIS_PROMPT_VERSION,
  SITE_ANALYSIS_SYSTEM_PROMPT,
  SITE_ANALYSIS_TOOL_DESCRIPTION,
  SITE_ANALYSIS_TOOL_NAME,
} from "@/lib/ai/site-analysis-prompt";
import {
  siteAnalysisResultSchema,
  type SiteAnalysisResult,
} from "@/lib/ai/site-analysis-schema";

export type SiteAnalysisAiCall = {
  result: SiteAnalysisResult;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  promptVersion: string;
};

/**
 * Função de chamada da IA para a análise de site: monta o prompt,
 * exige a saída pela tool com o schema estrito e devolve, junto com o
 * resultado, tudo que é preciso registrar (seção 20.1 do BRD: tokens de
 * entrada/saída, modelo, latência e versão do prompt).
 *
 * Lança AiResponseValidationError (ver src/lib/ai/errors.ts) quando a
 * IA não retorna um resultado válido — o chamador decide se tenta de
 * novo ou segue sem a análise (src/server/analyze-site.ts).
 */
export async function analyzeSiteContent(
  combinedText: string,
): Promise<SiteAnalysisAiCall> {
  const callResult = await generateStructuredJson({
    system: SITE_ANALYSIS_SYSTEM_PROMPT,
    userPrompt: buildSiteAnalysisUserPrompt(combinedText),
    schema: siteAnalysisResultSchema,
    toolName: SITE_ANALYSIS_TOOL_NAME,
    toolDescription: SITE_ANALYSIS_TOOL_DESCRIPTION,
    maxTokens: 1200,
  });

  return {
    result: callResult.data,
    inputTokens: callResult.inputTokens,
    outputTokens: callResult.outputTokens,
    model: callResult.model,
    latencyMs: callResult.latencyMs,
    promptVersion: SITE_ANALYSIS_PROMPT_VERSION,
  };
}
