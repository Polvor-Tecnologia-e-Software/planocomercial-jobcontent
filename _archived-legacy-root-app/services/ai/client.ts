/**
 * /services/ai/client.ts
 *
 * OpenAI client wrapper.
 * - Streaming via Server-Sent Events
 * - 30s hard timeout via AbortController
 * - 1 automatic retry on transient errors (rate limit, 5xx)
 * - Error classification into AIErrorCode
 * - Token usage tracking
 */

import OpenAI from "openai";
import type { AIErrorCode } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL = "gpt-4o-mini" as const;
const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 3_500;
const TEMPERATURE = 0.65; // slightly creative but consistent
const MAX_RETRIES = 1;

// ─── Singleton client (server-only) ───────────────────────────────────────────
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "placeholder-openai-key") {
      throw classifyError(new Error("OPENAI_API_KEY not configured"));
    }
    _client = new OpenAI({
      apiKey,
      maxRetries: 0, // we handle retries manually
      timeout: TIMEOUT_MS,
    });
  }
  return _client;
}

// ─── Classified AI error ──────────────────────────────────────────────────────
export class AIClientError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable: boolean,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AIClientError";
  }
}

function classifyError(err: unknown): AIClientError {
  if (err instanceof AIClientError) return err;

  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return new AIClientError("Rate limit exceeded", "OPENAI_RATE_LIMIT", true, 429);
    }
    if (err.status === 408 || err.message.includes("timeout")) {
      return new AIClientError("OpenAI request timed out", "OPENAI_TIMEOUT", true, 408);
    }
    if (err.status !== undefined && err.status >= 500) {
      return new AIClientError(`OpenAI server error: ${err.status}`, "OPENAI_API_ERROR", true, err.status);
    }
    return new AIClientError(`OpenAI API error: ${err.message}`, "OPENAI_API_ERROR", false, err.status);
  }

  if (err instanceof Error) {
    if (err.name === "AbortError" || err.message.includes("abort")) {
      return new AIClientError("Request aborted (timeout)", "OPENAI_TIMEOUT", true);
    }
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder-openai-key") {
      return new AIClientError("OPENAI_API_KEY not configured", "OPENAI_API_ERROR", false);
    }
  }

  return new AIClientError("Unknown AI error", "UNKNOWN", false);
}

// ─── Token usage ──────────────────────────────────────────────────────────────
export interface TokenUsage {
  input:  number;
  output: number;
  total:  number;
  cost_usd: number; // gpt-4o-mini: $0.15/1M input, $0.60/1M output
}

function calcCost(input: number, output: number): number {
  return (input * 0.00000015) + (output * 0.0000006);
}

// ─── Streaming generation ─────────────────────────────────────────────────────
export interface StreamingResult {
  full_text:   string;
  token_usage: TokenUsage;
  model:       string;
  duration_ms: number;
}

/**
 * Calls OpenAI with streaming.
 * `onChunk` is called for each text delta — pipe to SSE or accumulate.
 * Returns the full accumulated text and token usage.
 */
export async function generateWithStreaming(
  systemPrompt: string,
  userPrompt:   string,
  onChunk:      (chunk: string) => void,
  attempt = 0
): Promise<StreamingResult> {
  const startMs = Date.now();
  const controller = new AbortController();

  // Hard timeout
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = getClient();
    let fullText = "";
    let inputTokens  = 0;
    let outputTokens = 0;

    const stream = await client.chat.completions.create(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   },
        ],
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }

      // Capture usage from the final chunk
      if (chunk.usage) {
        inputTokens  = chunk.usage.prompt_tokens     ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    clearTimeout(timeoutId);

    return {
      full_text: fullText,
      token_usage: {
        input:    inputTokens,
        output:   outputTokens,
        total:    inputTokens + outputTokens,
        cost_usd: calcCost(inputTokens, outputTokens),
      },
      model:       MODEL,
      duration_ms: Date.now() - startMs,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const classified = classifyError(err);

    // Retry once on retryable errors
    if (classified.retryable && attempt < MAX_RETRIES) {
      const backoffMs = 1_500 * (attempt + 1);
      await new Promise((r) => setTimeout(r, backoffMs));
      return generateWithStreaming(systemPrompt, userPrompt, onChunk, attempt + 1);
    }

    throw classified;
  }
}

// ─── Non-streaming fallback (for /api/generate-plan when streaming isn't feasible) ──
export async function generateBlocking(
  systemPrompt: string,
  userPrompt:   string
): Promise<StreamingResult> {
  const startMs = Date.now();

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    });

    const fullText     = response.choices[0]?.message?.content ?? "";
    const inputTokens  = response.usage?.prompt_tokens     ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;

    return {
      full_text: fullText,
      token_usage: {
        input:    inputTokens,
        output:   outputTokens,
        total:    inputTokens + outputTokens,
        cost_usd: calcCost(inputTokens, outputTokens),
      },
      model:       MODEL,
      duration_ms: Date.now() - startMs,
    };
  } catch (err) {
    throw classifyError(err);
  }
}

export { MODEL, TIMEOUT_MS, MAX_OUTPUT_TOKENS };
