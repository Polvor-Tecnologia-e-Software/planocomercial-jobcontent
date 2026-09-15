import "server-only";

import OpenAI from "openai";
import { z, type ZodType } from "zod";

import { parseServerEnv } from "@/config/env.server";
import { AiResponseValidationError } from "@/lib/ai/errors";

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const env = parseServerEnv();
  cachedClient = new OpenAI({ apiKey: env.AI_API_KEY });
  return cachedClient;
}

export type GenerateStructuredJsonResult<T> = {
  data: T;
  inputTokens: number;
  outputTokens: number;
  model: string;
  /** Tempo de resposta da chamada de IA, em milissegundos. */
  latencyMs: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;
/** Número de tentativas ADICIONAIS após a primeira — 1 = no máximo 2 chamadas de rede no total. */
const DEFAULT_MAX_RETRIES = 1;

/**
 * Erro de transporte/infraestrutura da chamada de IA (timeout, rede,
 * indisponibilidade) — diferente de AiResponseValidationError, que é a
 * IA tendo respondido mas com um formato inválido. Quem chama decide o
 * que fazer (ex.: marcar o relatório como "failed" e oferecer nova
 * tentativa mais tarde — nunca perder o diagnóstico já calculado).
 */
export class AiCallError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiCallError";
  }
}

function isRetryableTransportError(err: unknown): boolean {
  // Checagem defensiva de typeof antes do instanceof: em testes com o SDK
  // mockado, OpenAI.APIError pode não existir — "instanceof undefined"
  // lançaria um TypeError próprio, mascarando o erro original.
  if (typeof OpenAI.APIError === "function" && err instanceof OpenAI.APIError) {
    if (err.status === 429) return true;
    if (typeof err.status === "number" && err.status >= 500) return true;
    return false;
  }
  return err instanceof Error && err.name === "AbortError";
}

/**
 * Chama o modelo de IA forçando o uso de uma "tool" (function calling da
 * OpenAI) cujos parameters são o JSON Schema derivado diretamente do
 * schema Zod (via z.toJSONSchema).
 *
 * Isso é deliberadamente melhor do que pedir "responda em JSON" em texto
 * livre:
 * - a IA nunca envolve a resposta em markdown (não há texto para
 *   envolver — a resposta já vem como argumentos estruturados da tool);
 * - o schema é descrito uma única vez, na própria chamada, em vez de
 *   ser repetido em prosa no prompt — menos tokens de entrada;
 * - "additionalProperties: false" (padrão do z.toJSONSchema) já orienta
 *   o modelo a não inventar campos extras, embora a validação final
 *   ainda seja sempre feita no servidor, nunca só confiando na IA.
 *
 * O modo "Structured Outputs" (strict: true) da OpenAI é OPT-IN por
 * chamador (params.strict), nunca ligado por padrão aqui: esse modo exige
 * que todo campo esteja em "required" (com opcionalidade expressa via
 * tipo anulável, ex.: `.nullable()`, nunca `.optional()`/`.default()`) —
 * um schema com campo `.optional()`/`.default()` faria a chamada inteira
 * falhar com erro 400. Confirme isso antes de passar strict:true para um
 * schema novo (ver src/lib/ai/commercial-plan.ts para um exemplo já
 * conferido como compatível). Mesmo com strict:true, `minLength`/
 * `maxLength` de string NÃO são impostos pela OpenAI (só minItems/maxItems
 * de array) — por isso o `schema.safeParse()` abaixo continua sendo
 * SEMPRE a validação real, nunca só uma formalidade.
 *
 * Timeout (AbortController) e um número limitado de retries se aplicam
 * só a falhas de transporte (timeout, 429, 5xx) — nunca a uma resposta
 * que veio mas não bate com o schema (AiResponseValidationError): repetir
 * automaticamente uma chamada já respondida gastaria tokens de novo sem
 * necessariamente corrigir o problema; quem chama decide se tenta de
 * novo (ver src/server/generate-commercial-plan.ts).
 */
export async function generateStructuredJson<T>(params: {
  system: string;
  userPrompt: string;
  schema: ZodType<T>;
  toolName: string;
  toolDescription: string;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  /** Só passe true para um schema já conferido: todo campo obrigatório ou `.nullable()`, nunca `.optional()`/`.default()`. */
  strict?: boolean;
}): Promise<GenerateStructuredJsonResult<T>> {
  const env = parseServerEnv();
  const client = getClient();
  const jsonSchema = z.toJSONSchema(params.schema, { target: "draft-7" });
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = params.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await client.chat.completions.create(
        {
          model: env.AI_MODEL,
          max_tokens: params.maxTokens ?? 1500,
          messages: [
            { role: "system", content: params.system },
            { role: "user", content: params.userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: params.toolName,
                description: params.toolDescription,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON Schema gerado dinamicamente pelo Zod.
                parameters: jsonSchema as any,
                ...(params.strict ? { strict: true } : {}),
              },
            },
          ],
          tool_choice: { type: "function", function: { name: params.toolName } },
        },
        { signal: controller.signal },
      );

      const latencyMs = Date.now() - startedAt;

      const toolCall = response.choices[0]?.message.tool_calls?.find(
        (call) => call.function.name === params.toolName,
      );

      if (!toolCall) {
        throw new AiResponseValidationError(
          "A IA não retornou uma chamada de tool com o resultado esperado.",
          response.choices[0]?.message,
        );
      }

      let parsedArguments: unknown;
      try {
        parsedArguments = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new AiResponseValidationError(
          "A resposta da IA não é um JSON válido.",
          toolCall.function.arguments,
        );
      }

      const validation = params.schema.safeParse(parsedArguments);
      if (!validation.success) {
        throw new AiResponseValidationError(
          `A resposta da IA não corresponde ao schema esperado: ${validation.error.message}`,
          parsedArguments,
        );
      }

      return {
        data: validation.data,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        model: env.AI_MODEL,
        latencyMs,
      };
    } catch (err) {
      if (err instanceof AiResponseValidationError) throw err;

      const retryable = isRetryableTransportError(err);
      if (retryable && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1_000 * (attempt + 1)));
        continue;
      }

      const isAbort = err instanceof Error && err.name === "AbortError";
      throw new AiCallError(
        isAbort ? "A chamada de IA excedeu o tempo limite." : "Falha na chamada de IA.",
        retryable,
        err,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
