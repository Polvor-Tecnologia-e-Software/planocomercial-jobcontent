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

  it("corta um campo de texto livre que ultrapassa o maxLength do schema, em vez de rejeitar a resposta inteira — bug real: a OpenAI nunca impõe maxLength de string, nem com strict:true", async () => {
    const schemaComLimite = z.object({ title: z.string().max(10) }).strict();
    createCompletion.mockResolvedValueOnce(toolResponse({ title: "um título bem maior que dez caracteres" }));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: schemaComLimite,
      toolName: "test_tool",
      toolDescription: "d",
    });

    expect(result.data.title).toBe("um título "); // 10 primeiros caracteres
    expect(result.data.title).toHaveLength(10);
  });

  it("corta o maxLength dentro de um array aninhado de objetos (cada item, independentemente)", async () => {
    const schemaComLista = z
      .object({ items: z.array(z.object({ note: z.string().max(5) }).strict()) })
      .strict();
    createCompletion.mockResolvedValueOnce(
      toolResponse({ items: [{ note: "curto" }, { note: "um texto bem mais longo que cinco" }] }),
    );

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: schemaComLista,
      toolName: "test_tool",
      toolDescription: "d",
    });

    expect(result.data.items[0].note).toBe("curto");
    expect(result.data.items[1].note).toBe("um te");
  });

  it("corta o maxLength de um campo nullable (.nullable() vira anyOf no JSON Schema)", async () => {
    const schemaComNullable = z.object({ summary: z.string().max(5).nullable() }).strict();
    createCompletion.mockResolvedValueOnce(toolResponse({ summary: "um resumo bem mais longo" }));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: schemaComNullable,
      toolName: "test_tool",
      toolDescription: "d",
    });

    expect(result.data.summary).toBe("um re");
  });

  it("NUNCA corta um valor de enum, mesmo que a validação acabe rejeitando — cortar só pioraria um valor já errado", async () => {
    const schemaComEnum = z.object({ confidence: z.enum(["low", "medium", "high"]) }).strict();
    createCompletion.mockResolvedValueOnce(toolResponse({ confidence: "Média" }));

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: schemaComEnum,
        toolName: "test_tool",
        toolDescription: "d",
      }),
    ).rejects.toThrow(AiResponseValidationError);
  });

  it("não corta uma string que já está dentro do limite", async () => {
    const schemaComLimite = z.object({ title: z.string().max(10) }).strict();
    createCompletion.mockResolvedValueOnce(toolResponse({ title: "curto" }));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: schemaComLimite,
      toolName: "test_tool",
      toolDescription: "d",
    });

    expect(result.data.title).toBe("curto");
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

/** Simula o stream do SDK: um iterável assíncrono de chunks com os argumentos da tool em pedaços. */
function streamOf(argumentsText: string, toolName = "test_tool") {
  const half = Math.ceil(argumentsText.length / 2);
  const chunks = [
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: toolName, arguments: argumentsText.slice(0, half) } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: argumentsText.slice(half) } }] }, finish_reason: "stop" }] },
    { choices: [], usage: { prompt_tokens: 12, completion_tokens: 7 } },
  ];
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk;
    },
  };
}

function hangUntilAborted() {
  return (_params: unknown, options: { signal: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      // Igual ao SDK real: cancela com um erro que NÃO se chama "AbortError".
      options.signal.addEventListener("abort", () => reject(new Error("Request was aborted.")));
    });
}

describe("generateStructuredJson — streaming e regras de repetição para chamadas longas", () => {
  it("com stream: pede stream + uso de tokens e junta os pedaços dos argumentos", async () => {
    createCompletion.mockResolvedValueOnce(streamOf(JSON.stringify({ ok: true })));

    const result = await generateStructuredJson({
      system: "s",
      userPrompt: "u",
      schema: SCHEMA,
      toolName: "test_tool",
      toolDescription: "d",
      stream: true,
    });

    expect(result.data).toEqual({ ok: true });
    expect(result.inputTokens).toBe(12);
    expect(result.outputTokens).toBe(7);
    const callArgs = createCompletion.mock.calls[0][0];
    expect(callArgs.stream).toBe(true);
    expect(callArgs.stream_options).toEqual({ include_usage: true });
  });

  it("com stream: tool diferente da pedida é tratada como resposta inválida", async () => {
    createCompletion.mockResolvedValueOnce(streamOf(JSON.stringify({ ok: true }), "outra_tool"));

    await expect(
      generateStructuredJson({ system: "s", userPrompt: "u", schema: SCHEMA, toolName: "test_tool", toolDescription: "d", stream: true }),
    ).rejects.toThrow(AiResponseValidationError);
  });

  it("reconhece o timeout pelo próprio cronômetro, mesmo com o erro de cancelamento do SDK (não 'AbortError')", async () => {
    createCompletion.mockImplementation(hangUntilAborted());

    await expect(
      generateStructuredJson({ system: "s", userPrompt: "u", schema: SCHEMA, toolName: "test_tool", toolDescription: "d", timeoutMs: 50, maxRetries: 0 }),
    ).rejects.toThrow("A chamada de IA excedeu o tempo limite.");
  }, 10_000);

  it("retryOnTimeout: false — não repete quando estoura o tempo (1 chamada só)", async () => {
    createCompletion.mockImplementation(hangUntilAborted());

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        timeoutMs: 50,
        maxRetries: 1,
        retryOnTimeout: false,
      }),
    ).rejects.toThrow(AiCallError);
    expect(createCompletion).toHaveBeenCalledTimes(1);
  }, 10_000);

  it("retryOnlyIfFailedWithinMs: repete uma falha rápida (ex.: 503 imediato)", async () => {
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
      retryOnlyIfFailedWithinMs: 30_000,
    });

    expect(result.data).toEqual({ ok: true });
    expect(createCompletion).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("retryOnlyIfFailedWithinMs: não repete uma falha que demorou mais que o limite", async () => {
    createCompletion.mockImplementationOnce(
      () => new Promise((_resolve, reject) => setTimeout(() => reject(new MockAPIError(503, "indisponível")), 60)),
    );

    await expect(
      generateStructuredJson({
        system: "s",
        userPrompt: "u",
        schema: SCHEMA,
        toolName: "test_tool",
        toolDescription: "d",
        maxRetries: 1,
        retryOnlyIfFailedWithinMs: 10,
      }),
    ).rejects.toThrow(AiCallError);
    expect(createCompletion).toHaveBeenCalledTimes(1);
  }, 10_000);

  it("a mensagem de falha traz o motivo real (status HTTP e mensagem do SDK)", async () => {
    createCompletion.mockRejectedValueOnce(new MockAPIError(400, "Invalid schema"));

    await expect(
      generateStructuredJson({ system: "s", userPrompt: "u", schema: SCHEMA, toolName: "test_tool", toolDescription: "d", maxRetries: 0 }),
    ).rejects.toThrow("Falha na chamada de IA (HTTP 400 APIError: Invalid schema).");
  });
});
