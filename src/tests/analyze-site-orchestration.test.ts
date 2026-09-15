import { beforeEach, describe, expect, it, vi } from "vitest";

const crawlSite = vi.fn();
const analyzeSiteContent = vi.fn();
const validateSiteAnalysisResult = vi.fn();
const createSiteAnalysis = vi.fn();
const findCachedAnalysis = vi.fn();
const createAiReport = vi.fn();

class FakeCrawlFailedException extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

class FakeAiResponseValidationError extends Error {
  raw: unknown;
  constructor(message: string, raw?: unknown) {
    super(message);
    this.raw = raw;
  }
}

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "x",
    AI_MODEL: "modelo-de-teste",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    APP_URL: "https://exemplo.com",
  }),
}));

vi.mock("@/lib/site-analysis/crawler", () => ({
  crawlSite,
  CrawlFailedException: FakeCrawlFailedException,
}));

vi.mock("@/lib/ai/site-analysis", () => ({ analyzeSiteContent }));
vi.mock("@/lib/ai/site-analysis-validation", () => ({ validateSiteAnalysisResult }));
vi.mock("@/lib/ai/errors", () => ({
  AiResponseValidationError: FakeAiResponseValidationError,
}));

vi.mock("@/lib/database", () => ({
  siteAnalyses: { createSiteAnalysis, findCachedAnalysis },
  aiReports: { createAiReport },
}));

const { analyzeSite } = await import("@/server/analyze-site");

const validResult = {
  company_name: "CodeBit",
  description: "Software sob medida",
  segment: "software_sob_medida",
  products_services: ["Desenvolvimento de sistemas"],
  main_offer: "Desenvolvimento de sistemas sob medida",
  apparent_target_audience: "Gestores de tecnologia",
  probable_business_model: "Venda consultiva",
  value_proposition: "Digitalizar processos",
  differentiators: [],
  commercial_proofs: [],
  calls_to_action: [],
  contact_channels: [],
  conversion_assets: [],
  main_findings: [],
  evidence: [],
  confidence: "high" as const,
};

beforeEach(() => {
  vi.clearAllMocks();

  crawlSite.mockResolvedValue({
    normalizedUrl: "https://codebit.com.br/",
    pages: [{ url: "https://codebit.com.br/", title: "CodeBit" }],
    combinedText: "Texto coletado do site da CodeBit.",
    contentHash: "hash-abc",
    warnings: [],
  });

  findCachedAnalysis.mockResolvedValue(null);

  analyzeSiteContent.mockResolvedValue({
    result: validResult,
    inputTokens: 500,
    outputTokens: 200,
    model: "modelo-de-teste",
    latencyMs: 1234,
    promptVersion: "site-analysis-v2",
  });

  validateSiteAnalysisResult.mockImplementation((raw: unknown) => raw);

  createSiteAnalysis.mockImplementation(async (input: Record<string, unknown>) => ({
    id: "site-analysis-1",
    ...input,
  }));

  createAiReport.mockResolvedValue({ id: "ai-report-1" });
});

describe("analyzeSite", () => {
  it("retorna 'skipped' quando não há site", async () => {
    const result = await analyzeSite({ diagnosticId: "diag-1", website: null });

    expect(result).toEqual({ status: "skipped", reason: "no_website" });
    expect(crawlSite).not.toHaveBeenCalled();
  });

  it("chama a IA e salva a análise em caso de cache miss, registrando tokens/modelo/latência/versão", async () => {
    const result = await analyzeSite({
      diagnosticId: "diag-1",
      website: "codebit.com.br",
    });

    expect(analyzeSiteContent).toHaveBeenCalledTimes(1);
    expect(createSiteAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnostic_id: "diag-1",
        status: "completed",
        content_hash: "hash-abc",
        result_json: validResult,
        prompt_version: "site-analysis-v2",
      }),
    );
    expect(createAiReport).toHaveBeenCalledWith(
      expect.objectContaining({
        cached: false,
        input_tokens: 500,
        output_tokens: 200,
        latency_ms: 1234,
        prompt_version: "site-analysis-v2",
        model: "modelo-de-teste",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: "completed",
        result: validResult,
        cached: false,
      }),
    );
  });

  it("reaproveita o cache e não chama a IA quando o hash bate", async () => {
    findCachedAnalysis.mockResolvedValue({
      id: "cached-1",
      result_json: validResult,
      model: "modelo-antigo",
      prompt_version: "site-analysis-v1",
    });

    const result = await analyzeSite({
      diagnosticId: "diag-2",
      website: "codebit.com.br",
    });

    expect(analyzeSiteContent).not.toHaveBeenCalled();
    expect(validateSiteAnalysisResult).toHaveBeenCalledWith(validResult);
    expect(createAiReport).toHaveBeenCalledWith(
      expect.objectContaining({ cached: true, input_tokens: 0, output_tokens: 0 }),
    );
    expect(result).toEqual(
      expect.objectContaining({ status: "completed", cached: true }),
    );
  });

  it("busca o cache filtrando também por prompt_version e model — nunca reaproveita um resultado de uma versão de prompt diferente", async () => {
    findCachedAnalysis.mockResolvedValue(null);

    await analyzeSite({ diagnosticId: "diag-2c", website: "codebit.com.br" });

    expect(findCachedAnalysis).toHaveBeenCalledWith(
      "https://codebit.com.br/",
      "hash-abc",
      "site-analysis-v2",
      "modelo-de-teste",
    );
  });

  it("chama a IA de novo quando o cache está corrompido/inválido", async () => {
    findCachedAnalysis.mockResolvedValue({
      id: "cached-1",
      result_json: { campo_invalido: true },
      model: "modelo-antigo",
      prompt_version: "site-analysis-v1",
    });
    validateSiteAnalysisResult.mockImplementation(() => {
      throw new FakeAiResponseValidationError("inválido");
    });

    const result = await analyzeSite({
      diagnosticId: "diag-2b",
      website: "codebit.com.br",
    });

    expect(analyzeSiteContent).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("completed");
  });

  it("retorna 'failed' e registra o motivo quando o crawler falha", async () => {
    crawlSite.mockRejectedValue(
      new FakeCrawlFailedException("dns_resolution_failed", "não resolveu"),
    );

    const result = await analyzeSite({
      diagnosticId: "diag-3",
      website: "site-invalido.com",
    });

    expect(result.status).toBe("failed");
    expect(createSiteAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ diagnostic_id: "diag-3", status: "failed" }),
    );
    expect(analyzeSiteContent).not.toHaveBeenCalled();
  });

  it.each(["dns_resolution_failed", "invalid_url", "blocked_hostname"])(
    "marca invalidWebsite = true quando o código do crawler é %s (endereço provavelmente errado)",
    async (code) => {
      crawlSite.mockRejectedValue(new FakeCrawlFailedException(code, "não resolveu"));

      const result = await analyzeSite({ diagnosticId: "diag-3b", website: "site-invalido.com" });

      expect(result).toEqual(expect.objectContaining({ status: "failed", invalidWebsite: true }));
    },
  );

  it("marca invalidWebsite = false quando a falha do crawler não indica um site errado (ex.: timeout)", async () => {
    crawlSite.mockRejectedValue(new FakeCrawlFailedException("timeout", "demorou demais"));

    const result = await analyzeSite({ diagnosticId: "diag-3c", website: "codebit.com.br" });

    expect(result).toEqual(expect.objectContaining({ status: "failed", invalidWebsite: false }));
  });

  it("retorna 'failed' e registra o ai_report como failed quando a IA retorna algo inválido", async () => {
    analyzeSiteContent.mockRejectedValue(
      new FakeAiResponseValidationError("json inválido"),
    );

    const result = await analyzeSite({
      diagnosticId: "diag-4",
      website: "codebit.com.br",
    });

    expect(result.status).toBe("failed");
    expect(createAiReport).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });
});
