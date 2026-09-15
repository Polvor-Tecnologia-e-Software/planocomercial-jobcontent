import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashContent } from "@/lib/site-analysis/hash";

const generateSeoKeywordSuggestions = vi.fn();
const getDiagnosticById = vi.fn();
const getCompanyById = vi.fn();
const createSeoAnalysis = vi.fn();
const findCachedAnalysis = vi.fn();
const parseServerEnv = vi.fn();

class FakeAiResponseValidationError extends Error {
  raw?: unknown;
  constructor(message: string, raw?: unknown) {
    super(message);
    this.name = "AiResponseValidationError";
    this.raw = raw;
  }
}

vi.mock("@/lib/ai/seo-keywords", () => ({ generateSeoKeywordSuggestions }));
vi.mock("@/lib/ai/errors", () => ({
  AiResponseValidationError: FakeAiResponseValidationError,
}));
vi.mock("@/config/env.server", () => ({ parseServerEnv }));

vi.mock("@/lib/database", () => ({
  diagnostics: { getDiagnosticById },
  companies: { getCompanyById },
  seoAnalyses: { createSeoAnalysis, findCachedAnalysis },
}));

const { analyzeSeoOpportunities } = await import("@/server/analyze-seo-opportunities");
const { SEO_KEYWORDS_PROMPT_VERSION } = await import("@/lib/ai/seo-keywords-prompt");

const KEYWORDS = ["consultoria financeira", "planejamento tributário", "abertura de empresa"];
const AI_MODEL = "gpt-4o-mini";

function expectedHash(keywords: string[], site: string | null, profileText: string): string {
  return hashContent(
    JSON.stringify({
      keywords: [...keywords].sort(),
      site,
      profileText,
      promptVersion: SEO_KEYWORDS_PROMPT_VERSION,
      model: AI_MODEL,
    }),
  );
}

const COMPANY_PROFILE_TEXT =
  "Somos uma consultoria financeira especializada em pequenas empresas.";

beforeEach(() => {
  vi.clearAllMocks();

  parseServerEnv.mockReturnValue({ AI_MODEL });

  getDiagnosticById.mockResolvedValue({ id: "diag-1", company_id: "company-1" });

  getCompanyById.mockResolvedValue({
    id: "company-1",
    keywords: KEYWORDS,
    normalized_website: "codebit.com.br",
    description: COMPANY_PROFILE_TEXT,
    main_offer: null,
    target_audience: null,
    differentiators: [],
    commercial_proofs: [],
    conversion_mechanisms: [],
  });

  findCachedAnalysis.mockResolvedValue(null);

  generateSeoKeywordSuggestions.mockResolvedValue({
    suggestions: [
      { keyword: "consultoria financeira", estimatedMonthlySearches: 1000, competition: "low" },
      { keyword: "planejamento tributário", estimatedMonthlySearches: 500, competition: "medium" },
    ],
    inputTokens: 100,
    outputTokens: 50,
    model: AI_MODEL,
    latencyMs: 800,
    promptVersion: SEO_KEYWORDS_PROMPT_VERSION,
  });

  createSeoAnalysis.mockImplementation(async (input: Record<string, unknown>) => ({
    id: "seo-analysis-1",
    ...input,
  }));
});

describe("analyzeSeoOpportunities", () => {
  it("retorna 'skipped' (diagnostic_not_found) quando o diagnóstico não existe", async () => {
    getDiagnosticById.mockResolvedValue(null);

    const result = await analyzeSeoOpportunities("inexistente");

    expect(result).toEqual({ status: "skipped", reason: "diagnostic_not_found" });
    expect(generateSeoKeywordSuggestions).not.toHaveBeenCalled();
  });

  it("retorna 'skipped' (no_keywords) quando a empresa não tem palavras-chave", async () => {
    getCompanyById.mockResolvedValue({ id: "company-1", keywords: [], normalized_website: null });

    const result = await analyzeSeoOpportunities("diag-1");

    expect(result).toEqual({ status: "skipped", reason: "no_keywords" });
    expect(generateSeoKeywordSuggestions).not.toHaveBeenCalled();
  });

  it("retorna 'skipped' (no_keywords) quando companies.keywords não é um array válido de strings", async () => {
    getCompanyById.mockResolvedValue({ id: "company-1", keywords: null, normalized_website: null });

    const result = await analyzeSeoOpportunities("diag-1");

    expect(result).toEqual({ status: "skipped", reason: "no_keywords" });
  });

  it("chama a IA, ranqueia e salva as sugestões em caso de cache miss", async () => {
    const result = await analyzeSeoOpportunities("diag-1");

    expect(generateSeoKeywordSuggestions).toHaveBeenCalledWith({
      seedKeywords: KEYWORDS,
      companyProfileText: COMPANY_PROFILE_TEXT,
    });
    expect(createSeoAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnostic_id: "diag-1",
        status: "completed",
        content_hash: expectedHash(KEYWORDS, "codebit.com.br", COMPANY_PROFILE_TEXT),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: "completed",
        cached: false,
        keywordIdeas: [
          expect.objectContaining({
            keyword: "consultoria financeira",
            avgMonthlySearches: 1000,
            opportunityRank: 1,
            coverageGap: false,
          }),
          expect.objectContaining({
            keyword: "planejamento tributário",
            avgMonthlySearches: 500,
            opportunityRank: 2,
            coverageGap: true,
          }),
        ],
      }),
    );
  });

  it("reaproveita o cache e não chama a IA de novo quando o hash bate", async () => {
    const cachedIdeas = [
      {
        keyword: "consultoria financeira",
        avgMonthlySearches: 1000,
        competition: "low",
        opportunityRank: 1,
        coverageGap: false,
      },
    ];
    findCachedAnalysis.mockResolvedValue({ id: "cached-1", keyword_ideas: cachedIdeas });

    const result = await analyzeSeoOpportunities("diag-1");

    expect(generateSeoKeywordSuggestions).not.toHaveBeenCalled();
    expect(createSeoAnalysis).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "completed",
      seoAnalysisId: "cached-1",
      keywordIdeas: cachedIdeas,
      cached: true,
    });
  });

  it("funciona sem site quando a empresa não tem site normalizado", async () => {
    getCompanyById.mockResolvedValue({
      id: "company-1",
      keywords: KEYWORDS,
      normalized_website: null,
      description: null,
      main_offer: null,
      target_audience: null,
      differentiators: [],
      commercial_proofs: [],
      conversion_mechanisms: [],
    });

    const result = await analyzeSeoOpportunities("diag-1");

    expect(generateSeoKeywordSuggestions).toHaveBeenCalledWith({
      seedKeywords: KEYWORDS,
      companyProfileText: "",
    });
    expect(result.status).toBe("completed");
  });

  it("retorna 'failed' e registra o motivo quando a IA retorna um resultado inválido, sem lançar", async () => {
    generateSeoKeywordSuggestions.mockRejectedValue(
      new FakeAiResponseValidationError("JSON inválido"),
    );

    const result = await analyzeSeoOpportunities("diag-1");

    expect(result).toEqual({
      status: "failed",
      seoAnalysisId: "seo-analysis-1",
      reason: "A IA retornou um resultado inválido para as palavras-chave.",
    });
    expect(createSeoAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        warnings: ["A IA retornou um resultado inválido para as palavras-chave."],
      }),
    );
  });

  it("nunca lança — mesmo com um erro inesperado (falha de transporte/rede)", async () => {
    generateSeoKeywordSuggestions.mockRejectedValue(new Error("erro genérico inesperado"));

    await expect(analyzeSeoOpportunities("diag-1")).resolves.toMatchObject({ status: "failed" });
  });
});
