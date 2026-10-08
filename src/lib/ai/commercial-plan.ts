import "server-only";

import { ensureBlogCadence } from "@/lib/ai/blog-cadence";
import { generateStructuredJson } from "@/lib/ai/client";
import {
  buildCommercialPlanSystemPrompt,
  buildCommercialPlanUserPrompt,
  COMMERCIAL_PLAN_PROMPT_VERSION,
  COMMERCIAL_PLAN_TOOL_DESCRIPTION,
  COMMERCIAL_PLAN_TOOL_NAME,
  type AIContext,
} from "@/lib/ai/commercial-plan-prompt";
import { CommercialPlanSchema, type CommercialPlan } from "@/schemas/commercial-plan";

export type CommercialPlanAiCall = {
  plan: CommercialPlan;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  promptVersion: string;
};

/**
 * Saída é grande (14 blocos incluindo strategicSummary e phaseSummaries,
 * até 3x7 ações — cada uma com 2-4 ideias em `details`; a cadência de
 * conteúdo e mídia é POR FASE — pedido explícito, mesma estrutura "2
 * content_blog + 1 rich_material + 1 landing_page + 1 paid_traffic" em
 * TODO MÊS, pra qualquer objetivo selecionado (paid_traffic deixou de ser
 * condicionado ao gargalo ser demanda): isso é 6 blogBrief + 3
 * richMaterialBrief + 3 landingPageBrief + 3 paidTrafficBrief GARANTIDOS
 * em todo plano, cada um desenvolvido por completo, sem versão rasa — bem
 * mais volume que a cadência "2 no plano inteiro" de uma versão anterior.
 * phaseSummaries acrescenta só ~300-400 tokens no total (goal + milestone
 * curtos por fase), irrelevante no teto geral).
 *
 * O modelo (AI_MODEL em .env.local) é "gpt-4.1-mini" (teto de saída de
 * ~32.768 tokens). 24.000 aqui deixa margem confortável acima do estimado
 * pra esse volume (~15-16k) e ainda abaixo do teto real do modelo. JSON
 * truncado = erro de validação, indistinguível de um erro de schema real
 * sem olhar o log — ver src/lib/ai/commercial-plan-prompt.ts.
 */
const MAX_OUTPUT_TOKENS = 24_000;

/**
 * Chamada de IA do plano comercial de 90 dias: monta o prompt (com o
 * bloco de Inbound Marketing quando aplicável), exige a saída pela tool
 * com o schema estrito, e devolve o resultado junto com tudo que precisa
 * ser registrado (tokens, modelo, latência, versão do prompt).
 *
 * Lança AiResponseValidationError ou AiCallError (ver src/lib/ai/client.ts
 * e src/lib/ai/errors.ts) em caso de falha — quem chama
 * (src/server/generate-commercial-plan.ts) decide como tratar.
 */
export async function generateCommercialPlanContent(context: AIContext): Promise<CommercialPlanAiCall> {
  const callResult = await generateStructuredJson({
    system: buildCommercialPlanSystemPrompt(
      context.primaryBottleneckCandidate,
      context.secondaryRiskCandidate,
    ),
    userPrompt: buildCommercialPlanUserPrompt(context),
    schema: CommercialPlanSchema,
    toolName: COMMERCIAL_PLAN_TOOL_NAME,
    toolDescription: COMMERCIAL_PLAN_TOOL_DESCRIPTION,
    maxTokens: MAX_OUTPUT_TOKENS,
    // Schema conferido: todo campo é obrigatório ou .nullable() (nunca
    // .optional()/.default()) — ver src/schemas/commercial-plan.ts.
    // Ativa o modo "Structured Outputs" da OpenAI para eliminar o erro de
    // estrutura visto em produção (campos aninhados no lugar errado,
    // ex.: "weeklyManagerAgenda" apareceu dentro de "plan90Days").
    strict: true,
    // Bug real em produção: o timeout padrão de generateStructuredJson
    // (DEFAULT_TIMEOUT_MS em src/lib/ai/client.ts) é 30s — dimensionado
    // pras chamadas pequenas (site-analysis, seo-keywords). Essa aqui gera
    // ~15-16k tokens de saída (ver MAX_OUTPUT_TOKENS acima), o que
    // facilmente passa de 30s num modelo real — o AbortController cortava
    // a chamada no meio, virando AiCallError("excedeu o tempo limite")
    // classificado como "transport_error" pra quem usa (ver
    // src/server/generate-commercial-plan.ts), mesmo a IA estando
    // perfeitamente disponível. 180s dá margem real pro tamanho desta
    // chamada específica.
    timeoutMs: 180_000,
    // Geração longa (~50-60s): streaming mantém a conexão ativa (quedas de
    // conexão em chamadas longas viravam "Falha na chamada de IA" e
    // exigiam "Tentar novamente"); sem repetir no timeout (dobraria a
    // espera para 6 min); repetição automática só de falha rápida.
    stream: true,
    retryOnTimeout: false,
    retryOnlyIfFailedWithinMs: 30_000,
  });

  // Garante 2 posts de blog por mês (regra fixa do produto) — o modelo às
  // vezes entrega só 1 mesmo com o prompt exigindo 2. Falha nesta chamada
  // extra nunca derruba o plano inteiro: entrega o que já veio e registra.
  let plan = callResult.data;
  let extraInputTokens = 0;
  let extraOutputTokens = 0;
  let extraLatencyMs = 0;
  try {
    const repaired = await ensureBlogCadence(context, plan);
    plan = repaired.plan;
    extraInputTokens = repaired.inputTokens;
    extraOutputTokens = repaired.outputTokens;
    extraLatencyMs = repaired.latencyMs;
  } catch (err) {
    console.error(
      "[commercial-plan] Não foi possível completar os posts de blog que faltavam:",
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    );
  }

  return {
    plan,
    inputTokens: callResult.inputTokens + extraInputTokens,
    outputTokens: callResult.outputTokens + extraOutputTokens,
    model: callResult.model,
    latencyMs: callResult.latencyMs + extraLatencyMs,
    promptVersion: COMMERCIAL_PLAN_PROMPT_VERSION,
  };
}
