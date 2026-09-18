import "server-only";

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
 * Saída é grande (12 blocos, até 3x5 ações — cada uma com 2-4 ideias em
 * `details`; a cadência de conteúdo OBRIGA 2 content_blog + 1
 * rich_material no PLANO INTEIRO — não por fase, revertido de "por fase"
 * depois de pesar o custo em tokens —, cada um com seu blogBrief/
 * richMaterialBrief completo e desenvolvido, sem versão rasa; ações
 * "crm_pipeline" que são cadência de follow-up também podem trazer um
 * cadenceBrief com a copy de 2-5 toques): orçamento generoso mesmo sendo
 * poucas peças, porque cada uma é bem completa.
 *
 * O modelo (AI_MODEL em .env.local) é "gpt-4.1-mini" (trocado de
 * "gpt-4o-mini" quando a cadência ainda era maior, por fase — teto de
 * saída de ~32.768 tokens, o dobro do anterior). Com a cadência de volta
 * a um total pequeno, esse teto maior deixou de ser indispensável, mas
 * não há motivo pra voltar ao modelo anterior (mesmo custo por token
 * relevante, mais headroom). 18.000 aqui é generoso o bastante pro volume
 * atual, com boa margem abaixo do teto real do modelo. JSON truncado =
 * erro de validação, indistinguível de um erro de schema real sem olhar
 * o log — ver src/lib/ai/commercial-plan-prompt.ts.
 */
const MAX_OUTPUT_TOKENS = 18_000;

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
  });

  return {
    plan: callResult.data,
    inputTokens: callResult.inputTokens,
    outputTokens: callResult.outputTokens,
    model: callResult.model,
    latencyMs: callResult.latencyMs,
    promptVersion: COMMERCIAL_PLAN_PROMPT_VERSION,
  };
}
