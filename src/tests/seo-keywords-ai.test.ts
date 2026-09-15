import { beforeEach, describe, expect, it, vi } from "vitest";

const createCompletion = vi.fn();

vi.mock("openai", () => ({
  default: class MockOpenAi {
    chat = { completions: { create: createCompletion } };
  },
}));

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "chave-de-teste",
    AI_MODEL: "modelo-de-teste",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    RD_STATION_CLIENT_ID: "x",
    RD_STATION_CLIENT_SECRET: "x",
    RD_STATION_REFRESH_TOKEN: "x",
    APP_URL: "https://exemplo.com",
  }),
}));

const { generateSeoKeywordSuggestions } = await import("@/lib/ai/seo-keywords");
const { AiResponseValidationError } = await import("@/lib/ai/errors");
const { SEO_KEYWORDS_PROMPT_VERSION, SEO_KEYWORDS_TOOL_NAME } =
  await import("@/lib/ai/seo-keywords-prompt");

const FAKE_VALID_RESULT = {
  suggestions: [
    { keyword: "consultoria financeira para pme", estimatedMonthlySearches: 480, competition: "medium" as const },
    { keyword: "assessoria financeira empresarial", estimatedMonthlySearches: 210, competition: "low" as const },
  ],
};

function mockToolUseResponse(input: unknown) {
  createCompletion.mockResolvedValue({
    choices: [
      {
        message: {
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: SEO_KEYWORDS_TOOL_NAME, arguments: JSON.stringify(input) },
            },
          ],
        },
      },
    ],
    usage: { prompt_tokens: 300, completion_tokens: 120 },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateSeoKeywordSuggestions (SDK da OpenAI mockado)", () => {
  it("retorna as sugestões junto com tokens, modelo, latência e versão do prompt", async () => {
    mockToolUseResponse(FAKE_VALID_RESULT);

    const result = await generateSeoKeywordSuggestions({
      seedKeywords: ["consultoria financeira"],
      companyProfileText: "Consultoria financeira para pequenas empresas.",
    });

    expect(result.suggestions).toEqual(FAKE_VALID_RESULT.suggestions);
    expect(result.inputTokens).toBe(300);
    expect(result.outputTokens).toBe(120);
    expect(result.model).toBe("modelo-de-teste");
    expect(result.promptVersion).toBe(SEO_KEYWORDS_PROMPT_VERSION);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("força o uso da tool com strict:true e envia as palavras-chave e o perfil no prompt do usuário", async () => {
    mockToolUseResponse(FAKE_VALID_RESULT);

    await generateSeoKeywordSuggestions({
      seedKeywords: ["consultoria financeira", "planejamento tributário"],
      companyProfileText: "Perfil de teste da empresa.",
    });

    expect(createCompletion).toHaveBeenCalledTimes(1);
    const callArgs = createCompletion.mock.calls[0][0];

    expect(callArgs.tool_choice).toEqual({
      type: "function",
      function: { name: SEO_KEYWORDS_TOOL_NAME },
    });
    expect(callArgs.tools[0].function.name).toBe(SEO_KEYWORDS_TOOL_NAME);
    expect(callArgs.tools[0].function.strict).toBe(true);

    const userMessage = callArgs.messages[1].content as string;
    expect(userMessage).toContain("consultoria financeira, planejamento tributário");
    expect(userMessage).toContain("Perfil de teste da empresa.");
  });

  it("lança AiResponseValidationError quando a IA não chama a tool", async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: "Não posso ajudar com isso." } }],
      usage: { prompt_tokens: 50, completion_tokens: 10 },
    });

    await expect(
      generateSeoKeywordSuggestions({ seedKeywords: ["x"], companyProfileText: "" }),
    ).rejects.toThrow(AiResponseValidationError);
  });

  it("lança AiResponseValidationError quando a resposta não bate com o schema (campo extra)", async () => {
    mockToolUseResponse({
      suggestions: [{ ...FAKE_VALID_RESULT.suggestions[0], campoExtra: "valor" }],
    });

    await expect(
      generateSeoKeywordSuggestions({ seedKeywords: ["x"], companyProfileText: "" }),
    ).rejects.toThrow(AiResponseValidationError);
  });

  it("lança AiResponseValidationError quando faltam sugestões (array vazio)", async () => {
    mockToolUseResponse({ suggestions: [] });

    await expect(
      generateSeoKeywordSuggestions({ seedKeywords: ["x"], companyProfileText: "" }),
    ).rejects.toThrow(AiResponseValidationError);
  });
});
