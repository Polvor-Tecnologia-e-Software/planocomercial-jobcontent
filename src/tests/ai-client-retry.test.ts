import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { createCompletion, MockAPIError } = vi.hoisted(() => {
  class MockAPIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "APIError";
      this.status = status;
    }
  }
  return { createCompletion: vi.fn(), MockAPIError };
});

vi.mock("openai", () => {
  class MockOpenAiClient {
    chat = { completions: { create: createCompletion } };
  }
  // Anexa APIError como propriedade ESTÁTICA da classe (OpenAI.APIError),
  // igual ao SDK real — sem isso, "err instanceof OpenAI.APIError" no
  // client.ts não teria como reconhecer os erros simulados aqui.
  return { default: Object.assign(MockOpenAiClient, { APIError: MockAPIError }) };
});

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "chave-de-teste",
    AI_MODEL: "modelo-de-teste",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    APP_URL: "https://exemplo.com",
  }),
}));

const { generateStructuredJson, AiCallError } = await import("@/lib/ai/client");
const { AiResponseValidationError } = await import("@/lib/ai/errors");

const SCHEMA = z.object({ ok: z.boolean() }).strict();

function toolResponse(input: unknown) {
  return {
    choices: [
      {
        message: {
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "test_tool", arguments: JSON.stringify(input) },
            },
          ],
        },
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateStructuredJson — opção strict (Structured Outputs)", () => {
  it("não envia 'strict' na function quando o chamador não pede (comportamento padrão)", async () => {
    createCompletion.mockResolvedValueOnce(toolResponse({ ok: true }));

    await generateStructuredJson({ system: "s", userPrompt: "u", schema: SCHEMA, toolName: "test_tool", toolDescription: "d" });

    const callArgs = createCompletion.mock.calls[0][0];
    expect(callArgs.tools[0].function.strict).toBeUndefined();
  });

  it("envia strict:true na function quando o chamador pede explicitamente", async () => {
    createCompletion.mockResolvedValueOnce(toolResponse({ ok: true }));

    await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: SCHEMA,
      toolName: "test_tool",
      toolDescription: "d",
      strict: true,
    });

    const callArgs = createCompletion.mock.calls[0][0];
    expect(callArgs.tools[0].function.strict).toBe(true);
  });
});

describe("generateStructuredJson — retry limitado em falhas de transporte", () => {
  it("não tenta de novo numa resposta bem-sucedida (1 chamada só)", async () => {
    createCompletion.mockResolvedValueOnce(toolResponse({ ok: true }));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: SCHEMA,
      toolName: "test_tool",
      toolDescription: "d",
    });

    expect(result.data).toEqual({ ok: true });
    expect(createCompletion).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo uma vez em erro 503 (indisponibilidade) e tem sucesso na segunda", async () => {
    createCompletion
      .mockRejectedValueOnce(new MockAPIError(503, "indisponível"))
      .mockResolvedValueOnce(toolResponse({ ok: true }));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: SCHEMA,
      toolName: "test_tool",
      toolDescription: "d",
      maxRetries: 1,
    });

    expect(result.data).toEqual({ ok: true });
    expect(createCompletion).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("tenta de novo em erro 429 (rate limit)", async () => {
    createCompletion
      .mockRejectedValueOnce(new MockAPIError(429, "rate limited"))
      .mockResolvedValueOnce(toolResponse({ ok: true }));

    await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: SCHEMA,
      toolName: "test_tool",
      toolDescription: "d",
      maxRetries: 1,
    });

    expect(createCompletion).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("desiste após esgotar o limite de tentativas e lança AiCallError", async () => {
    createCompletion.mockRejectedValue(new MockAPIError(500, "erro do servidor"));

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        maxRetries: 1,
      }),
    ).rejects.toThrow(AiCallError);

    expect(createCompletion).toHaveBeenCalledTimes(2); // 1 original + 1 retry
  }, 10_000);

  it("NÃO tenta de novo quando a resposta veio mas não bate com o schema (evita gastar tokens em dobro)", async () => {
    createCompletion.mockResolvedValueOnce(toolResponse({ campo_errado: true }));

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        maxRetries: 2,
      }),
    ).rejects.toThrow(AiResponseValidationError);

    expect(createCompletion).toHaveBeenCalledTimes(1);
  });

  it("lança AiResponseValidationError quando os argumentos da tool não são um JSON válido", async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            tool_calls: [
              { id: "call_1", type: "function", function: { name: "test_tool", arguments: "{isso não é json" } },
            ],
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
      }),
    ).rejects.toThrow(AiResponseValidationError);
  });

  it("erro 400 (não retryable) não gera nova tentativa", async () => {
    createCompletion.mockRejectedValueOnce(new MockAPIError(400, "requisição inválida"));

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        maxRetries: 2,
      }),
    ).rejects.toThrow(AiCallError);

    expect(createCompletion).toHaveBeenCalledTimes(1);
  });

  it("aplica timeout: uma chamada que nunca resolve é abortada", async () => {
    createCompletion.mockImplementation(
      (_params: unknown, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        timeoutMs: 50,
        maxRetries: 0,
      }),
    ).rejects.toThrow(AiCallError);
  }, 10_000);
});
