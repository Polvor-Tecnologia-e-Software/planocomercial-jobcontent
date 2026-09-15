import { describe, expect, it } from "vitest";

import {
  MAX_KEYWORD_OPPORTUNITIES,
  rankKeywordOpportunities,
  type KeywordIdea,
} from "@/lib/seo/keyword-opportunity";

describe("rankKeywordOpportunities", () => {
  it("ordena por volume × peso da concorrência, decrescente", () => {
    const ideas: KeywordIdea[] = [
      { keyword: "alta concorrência, alto volume", avgMonthlySearches: 1000, competition: "high" },
      { keyword: "baixa concorrência, alto volume", avgMonthlySearches: 1000, competition: "low" },
      { keyword: "média concorrência, alto volume", avgMonthlySearches: 1000, competition: "medium" },
    ];

    const result = rankKeywordOpportunities(ideas);

    expect(result.map((r) => r.keyword)).toEqual([
      "baixa concorrência, alto volume",
      "média concorrência, alto volume",
      "alta concorrência, alto volume",
    ]);
  });

  it("atribui opportunityRank sequencial começando em 1", () => {
    const ideas: KeywordIdea[] = [
      { keyword: "a", avgMonthlySearches: 500, competition: "low" },
      { keyword: "b", avgMonthlySearches: 100, competition: "low" },
    ];

    const result = rankKeywordOpportunities(ideas);

    expect(result[0]).toMatchObject({ keyword: "a", opportunityRank: 1 });
    expect(result[1]).toMatchObject({ keyword: "b", opportunityRank: 2 });
  });

  it("descarta palavras sem volume de busca (null)", () => {
    const ideas: KeywordIdea[] = [
      { keyword: "sem volume", avgMonthlySearches: null, competition: "low" },
      { keyword: "com volume", avgMonthlySearches: 100, competition: "low" },
    ];

    const result = rankKeywordOpportunities(ideas);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe("com volume");
  });

  it("descarta palavras com volume zero", () => {
    const ideas: KeywordIdea[] = [
      { keyword: "volume zero", avgMonthlySearches: 0, competition: "low" },
      { keyword: "com volume", avgMonthlySearches: 100, competition: "low" },
    ];

    const result = rankKeywordOpportunities(ideas);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe("com volume");
  });

  it("mantém uma palavra com volume mesmo que a concorrência seja desconhecida, ordenada por último entre volumes iguais", () => {
    const ideas: KeywordIdea[] = [
      { keyword: "concorrência desconhecida", avgMonthlySearches: 100, competition: "unknown" },
      { keyword: "concorrência baixa", avgMonthlySearches: 100, competition: "low" },
    ];

    const result = rankKeywordOpportunities(ideas);

    expect(result.map((r) => r.keyword)).toEqual(["concorrência baixa", "concorrência desconhecida"]);
  });

  it("nunca inventa avgMonthlySearches ou competition — apenas repassa os valores recebidos", () => {
    const ideas: KeywordIdea[] = [{ keyword: "teste", avgMonthlySearches: 42, competition: "medium" }];

    const result = rankKeywordOpportunities(ideas);

    expect(result[0].avgMonthlySearches).toBe(42);
    expect(result[0].competition).toBe("medium");
  });

  it(`limita a ${MAX_KEYWORD_OPPORTUNITIES} oportunidades`, () => {
    const ideas: KeywordIdea[] = Array.from({ length: MAX_KEYWORD_OPPORTUNITIES + 5 }, (_, i) => ({
      keyword: `palavra-${i}`,
      avgMonthlySearches: 100 - i,
      competition: "low" as const,
    }));

    const result = rankKeywordOpportunities(ideas);

    expect(result).toHaveLength(MAX_KEYWORD_OPPORTUNITIES);
    expect(result[0].keyword).toBe("palavra-0");
  });

  it("retorna lista vazia quando nenhuma ideia tem volume de busca", () => {
    const ideas: KeywordIdea[] = [{ keyword: "sem dado", avgMonthlySearches: null, competition: "unknown" }];
    expect(rankKeywordOpportunities(ideas)).toEqual([]);
  });

  it("retorna lista vazia quando a entrada é vazia", () => {
    expect(rankKeywordOpportunities([])).toEqual([]);
  });
});
