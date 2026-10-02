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
    // 1200 bastava com o modelo anterior, mas AI_MODEL (.env.local) é
    // global a todas as chamadas de IA do app — a troca para
    // "gpt-4.1-mini" (mais verboso, ver MAX_OUTPUT_TOKENS em
    // commercial-plan.ts) fazia a resposta da tool call estourar esse
    // limite e cortar no meio do JSON, gerando
    // AiResponseValidationError("A resposta da IA não é um JSON
    // válido.") mesmo com a chamada tendo ido bem — era truncamento, não
    // um erro de schema. 3000 dá margem confortável pro schema atual
    // (~14 campos, vários arrays de string + lista de evidências).
    maxTokens: 3000,
    // Sem strict:true de propósito (diferente de commercial-plan.ts e
    // seo-keywords.ts): siteAnalysisResultSchema tem vários campos
    // `.array(...).default([])`, e o modo Structured Outputs da OpenAI
    // rejeita a chamada inteira (erro 400) se algum campo não for
    // obrigatório/`.nullable()` — migrar pra `.nullable()` exigiria também
    // ajustar todo consumidor que hoje assume array nunca nulo (ver
    // site-analysis-confirmation.tsx). Por não ter strict, o enum de
    // confidence não é garantido pela API — ver a normalização em
    // site-analysis-schema.ts (CONFIDENCE_ALIASES) que cobre esse gap.
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
