/**
 * /services/ai/index.ts
 *
 * Main orchestrator for AI plan generation.
 * Ties together: sanitiser → prompt builder → client → validator → persistence.
 *
 * Two public functions:
 *  1. generatePlanStreaming() — for the SSE streaming API route
 *  2. generatePlanBlocking()  — for non-streaming contexts (PDF, RD Station trigger)
 */

import type {
  GeneratePlanInput,
  GeneratePlanResult,
  StreamEvent,
  GrowthPlan,
} from "./types";
import { sanitizeAIPayload } from "./sanitizer";
import { SYSTEM_PROMPT, buildUserPrompt, estimatePromptTokens } from "./prompt-builder";
import { generateWithStreaming, generateBlocking, AIClientError } from "./client";
import { validateAndParsePlan } from "./validator";
import { persistAIReport } from "@/lib/supabase/ai-report-repository";

// ─── Streaming generation ─────────────────────────────────────────────────────
/**
 * Generates a growth plan with streaming.
 * Calls `onEvent` for each SSE event. Never throws — errors come as events.
 */
export async function generatePlanStreaming(
  input: GeneratePlanInput,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const startMs = Date.now();

  try {
    // 1. Sanitise
    onEvent({ type: "status", message: "Analisando dados da empresa..." });
    onEvent({ type: "progress", pct: 5 });

    const { company_name, payload_json } = sanitizeAIPayload(
      input.company_name,
      input.ai_payload as unknown as Record<string, unknown>
    );

    // 2. Build prompts
    const userPrompt = buildUserPrompt(company_name, payload_json);
    const tokenEst   = estimatePromptTokens(userPrompt);

    console.log(`[ai] Estimated prompt tokens: ${tokenEst.total}`);
    onEvent({ type: "status",   message: "Consultora IA iniciando diagnóstico..." });
    onEvent({ type: "progress", pct: 15 });

    // 3. Stream from OpenAI
    let accumulatedText = "";
    let chunkCount = 0;

    onEvent({ type: "status", message: "Gerando plano estratégico personalizado..." });

    const streamResult = await generateWithStreaming(
      SYSTEM_PROMPT,
      userPrompt,
      (chunk) => {
        accumulatedText += chunk;
        chunkCount++;
        onEvent({ type: "chunk", text: chunk });

        // Progress based on estimated output tokens
        const estimatedPct = Math.min(85, 15 + Math.floor((chunkCount / 120) * 70));
        if (chunkCount % 10 === 0) {
          onEvent({ type: "progress", pct: estimatedPct });
        }
      }
    );

    onEvent({ type: "status",   message: "Validando e estruturando o plano..." });
    onEvent({ type: "progress", pct: 88 });

    // 4. Validate response
    const validation = validateAndParsePlan(accumulatedText);

    if (!validation.valid || !validation.plan) {
      console.error("[ai] Validation failed:", validation.errors);
      onEvent({
        type: "error",
        message: "A IA retornou uma resposta inválida. Por favor, tente novamente.",
        code: "INVALID_RESPONSE",
      });
      return;
    }

    if (validation.errors.length > 0) {
      console.warn("[ai] Validation warnings:", validation.errors);
    }

    onEvent({ type: "status",   message: "Salvando resultado..." });
    onEvent({ type: "progress", pct: 93 });

    // 5. Persist
    const persistResult = await persistAIReport(validation.plan, {
      diagnostic_id:  input.diagnostic_id,
      company_name,
      scores: {
        overall:   input.ai_payload.scores.overall,
        demanda:   input.ai_payload.scores.demanda,
        conversao: input.ai_payload.scores.conversao,
        escala:    input.ai_payload.scores.escala,
        level:     input.ai_payload.scores.level,
      },
      bottleneck_type: input.ai_payload.main_bottleneck.type,
      tokens_input:    streamResult.token_usage.input,
      tokens_output:   streamResult.token_usage.output,
      cost_usd:        streamResult.token_usage.cost_usd,
      model:           streamResult.model,
      duration_ms:     Date.now() - startMs,
    });

    console.log(
      `[ai] Plan generated in ${Date.now() - startMs}ms | ` +
      `tokens: ${streamResult.token_usage.total} | ` +
      `cost: $${streamResult.token_usage.cost_usd.toFixed(5)} | ` +
      `persisted: ${persistResult.persisted} (mock: ${persistResult.mocked})`
    );

    onEvent({ type: "progress", pct: 100 });
    onEvent({ type: "done",     plan: validation.plan });

  } catch (err) {
    if (err instanceof AIClientError) {
      console.error(`[ai] AIClientError (${err.code}):`, err.message);
      onEvent({
        type:    "error",
        message: friendlyErrorMessage(err.code),
        code:    err.code,
      });
    } else if (err instanceof Error && err.message.includes("Prompt injection")) {
      console.warn("[ai] Injection attempt blocked:", err.message);
      onEvent({
        type:    "error",
        message: "Dados de entrada inválidos. Por favor, use apenas caracteres válidos.",
        code:    "PROMPT_INJECTION",
      });
    } else {
      console.error("[ai] Unknown error:", err);
      onEvent({
        type:    "error",
        message: "Erro inesperado. Por favor, tente novamente em instantes.",
        code:    "UNKNOWN",
      });
    }
  }
}

// ─── Blocking generation (for server-side use) ────────────────────────────────
export async function generatePlanBlocking(
  input: GeneratePlanInput
): Promise<GeneratePlanResult> {
  const startMs = Date.now();

  const { company_name, payload_json } = sanitizeAIPayload(
    input.company_name,
    input.ai_payload as unknown as Record<string, unknown>
  );

  const userPrompt = buildUserPrompt(company_name, payload_json);
  const result     = await generateBlocking(SYSTEM_PROMPT, userPrompt);
  const validation = validateAndParsePlan(result.full_text);

  if (!validation.valid || !validation.plan) {
    throw new Error(`AI response validation failed: ${validation.errors.join(", ")}`);
  }

  const persistResult = await persistAIReport(validation.plan, {
    diagnostic_id:  input.diagnostic_id,
    company_name,
    scores: {
      overall:   input.ai_payload.scores.overall,
      demanda:   input.ai_payload.scores.demanda,
      conversao: input.ai_payload.scores.conversao,
      escala:    input.ai_payload.scores.escala,
      level:     input.ai_payload.scores.level,
    },
    bottleneck_type: input.ai_payload.main_bottleneck.type,
    tokens_input:    result.token_usage.input,
    tokens_output:   result.token_usage.output,
    cost_usd:        result.token_usage.cost_usd,
    model:           result.model,
    duration_ms:     Date.now() - startMs,
  });

  return {
    plan: validation.plan,
    persist_result: persistResult,
    meta: {
      model:        result.model,
      tokens_input: result.token_usage.input,
      tokens_output:result.token_usage.output,
      duration_ms:  Date.now() - startMs,
      cost_usd:     result.token_usage.cost_usd,
    },
  };
}

// ─── User-facing error messages ───────────────────────────────────────────────
function friendlyErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    OPENAI_TIMEOUT:    "A geração demorou mais que o esperado. Tentando novamente...",
    OPENAI_RATE_LIMIT: "Muitas requisições simultâneas. Aguarde alguns segundos e tente novamente.",
    OPENAI_API_ERROR:  "Serviço de IA temporariamente indisponível. Tente novamente em instantes.",
    INVALID_RESPONSE:  "A IA retornou uma resposta inesperada. Por favor, tente novamente.",
    PROMPT_INJECTION:  "Dados de entrada inválidos detectados.",
    UNKNOWN:           "Erro inesperado. Por favor, tente novamente.",
  };
  return messages[code] ?? messages.UNKNOWN;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { GrowthPlan, GeneratePlanInput, GeneratePlanResult, StreamEvent } from "./types";
