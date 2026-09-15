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

const { analyzeSiteContent } = await import("@/lib/ai/site-analysis");
const { AiResponseValidationError } = await import("@/lib/ai/errors");
const { SITE_ANALYSIS_PROMPT_VERSION, SITE_ANALYSIS_TOOL_NAME } =
  await import("@/lib/ai/site-analysis-prompt");

/** Conteúdo fictício de site, no formato que o crawler produziria. */
const FAKE_SITE_CONTENT = `### Página: https://codebit.com.br/
CodeBit desenvolve softwares personalizados para empresas que precisam
digitalizar processos e integrar operações.

### Página: https://codebit.com.br/sobre
Atendemos gestores de tecnologia, operações e inovação com um modelo de
venda consultiva.`;

const FAKE_VALID_RESULT = {
  company_name: "CodeBit",
  description: "Desenvolve softwares personalizados para digitalização de processos.",
  segment: "software_sob_medida",
  products_services: ["Desenvolvimento de software sob medida"],
  main_offer: "Digitalização e integração de operações",
  apparent_target_audience: "Gestores de tecnologia, operações e inovação",
  probable_business_model: "Venda consultiva",
  value_proposition: "Digitalizar processos e integrar operações",
  differentiators: [],
  commercial_proofs: [],
  calls_to_action: [],
  contact_channels: [],
  conversion_assets: [],
  main_findings: ["Site orientado a decisores técnicos de médio/grande porte"],
  evidence: [
    {
      field: "probable_business_model" as const,
      page_url: "https://codebit.com.br/sobre",
      excerpt: "modelo de venda consultiva",
      confidence: "medium" as const,
    },
  ],
  confidence: "medium" as const,
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
              function: { name: SITE_ANALYSIS_TOOL_NAME, arguments: JSON.stringify(input) },
            },
          ],
        },
      },
    ],
    usage: { prompt_tokens: 842, completion_tokens: 231 },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("analyzeSiteContent (conteúdo fictício, SDK da OpenAI mockado)", () => {
  it("retorna o resultado validado junto com tokens, modelo, latência e versão do prompt", async () => {
    mockToolUseResponse(FAKE_VALID_RESULT);

    const result = await analyzeSiteContent(FAKE_SITE_CONTENT);

    expect(result.result).toEqual(FAKE_VALID_RESULT);
    expect(result.inputTokens).toBe(842);
    expect(result.outputTokens).toBe(231);
    expect(result.model).toBe("modelo-de-teste");
    expect(result.promptVersion).toBe(SITE_ANALYSIS_PROMPT_VERSION);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("força o uso da tool com o schema estrito (tool_choice)", async () => {
    mockToolUseResponse(FAKE_VALID_RESULT);

    await analyzeSiteContent(FAKE_SITE_CONTENT);

    expect(createCompletion).toHaveBeenCalledTimes(1);
    const callArgs = createCompletion.mock.calls[0][0];

    expect(callArgs.tool_choice).toEqual({
      type: "function",
      function: { name: SITE_ANALYSIS_TOOL_NAME },
    });
    expect(callArgs.tools[0].function.name).toBe(SITE_ANALYSIS_TOOL_NAME);
    expect(callArgs.tools[0].function.parameters.additionalProperties).toBe(false);
    expect(callArgs.messages[0]).toEqual(
      expect.objectContaining({ role: "system", content: expect.stringContaining("DADO NÃO CONFIÁVEL") }),
    );
  });

  it("nunca envia o texto do site fora da tag delimitadora <site>", async () => {
    mockToolUseResponse(FAKE_VALID_RESULT);

    await analyzeSiteContent(FAKE_SITE_CONTENT);

    const callArgs = createCompletion.mock.calls[0][0];
    const userMessage = callArgs.messages[1].content as string;

    expect(userMessage).toContain("<site>");
    expect(userMessage).toContain("</site>");
    expect(userMessage).toContain("CodeBit desenvolve softwares personalizados");
  });

  it("lança AiResponseValidationError quando a IA não chama a tool (responde só texto)", async () => {
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: "Desculpe, não posso ajudar com isso." } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    });

    await expect(analyzeSiteContent(FAKE_SITE_CONTENT)).rejects.toThrow(
      AiResponseValidationError,
    );
  });

  it("lança AiResponseValidationError quando a tool é chamada com campo inesperado", async () => {
    mockToolUseResponse({
      ...FAKE_VALID_RESULT,
      campo_que_nao_deveria_existir: "valor",
    });

    await expect(analyzeSiteContent(FAKE_SITE_CONTENT)).rejects.toThrow(
      AiResponseValidationError,
    );
  });

  it("lança AiResponseValidationError quando falta um campo obrigatório", async () => {
    const incomplete: Partial<typeof FAKE_VALID_RESULT> = { ...FAKE_VALID_RESULT };
    delete incomplete.confidence;
    mockToolUseResponse(incomplete);

    await expect(analyzeSiteContent(FAKE_SITE_CONTENT)).rejects.toThrow(
      AiResponseValidationError,
    );
  });
});
