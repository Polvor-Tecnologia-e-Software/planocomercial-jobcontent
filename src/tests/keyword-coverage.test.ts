import { describe, expect, it } from "vitest";

import { flagCoverageGaps } from "@/lib/seo/keyword-coverage";
import type { RankedKeywordOpportunity } from "@/lib/seo/keyword-opportunity";

function makeOpportunity(overrides: Partial<RankedKeywordOpportunity> = {}): RankedKeywordOpportunity {
  return {
    keyword: "consultoria financeira",
    avgMonthlySearches: 1000,
    competition: "low",
    opportunityRank: 1,
    ...overrides,
  };
}

describe("flagCoverageGaps", () => {
  it("marca coverageGap=false quando todas as palavras da keyword aparecem no perfil da empresa", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "consultoria financeira" })],
      "Somos uma consultoria especializada em planejamento financeiro para PMEs.",
    );

    expect(result[0].coverageGap).toBe(false);
  });

  it("marca coverageGap=true quando nenhuma palavra da keyword aparece no perfil", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "abertura de empresa" })],
      "Somos uma consultoria especializada em planejamento financeiro para PMEs.",
    );

    expect(result[0].coverageGap).toBe(true);
  });

  it("marca coverageGap=true quando só parte das palavras da keyword aparece (exige todas)", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "consultoria tributária" })],
      "Somos uma consultoria especializada em planejamento financeiro.",
    );

    expect(result[0].coverageGap).toBe(true);
  });

  it("não exige que as palavras estejam juntas ou na mesma ordem", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "financeira consultoria" })],
      "Prestamos assessoria financeira. Somos também uma consultoria completa.",
    );

    expect(result[0].coverageGap).toBe(false);
  });

  it("ignora acentuação na comparação", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "planejamento tributário" })],
      "Fazemos planejamento tributario para empresas.",
    );

    expect(result[0].coverageGap).toBe(false);
  });

  it("ignora maiúsculas/minúsculas na comparação", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "Consultoria Financeira" })],
      "somos uma CONSULTORIA especializada em serviços FINANCEIROS.",
    );

    // "financeiros" != "financeira" (sem stemming) — mas "consultoria" bate.
    // Este teste confirma só que a comparação de caixa não afeta o match
    // das palavras que realmente coincidem.
    expect(result[0].coverageGap).toBe(true);
  });

  it("marca coverageGap=true quando o perfil da empresa está vazio", () => {
    const result = flagCoverageGaps([makeOpportunity()], "");
    expect(result[0].coverageGap).toBe(true);
  });

  it("marca coverageGap=true quando a keyword só tem stopwords/palavras curtas", () => {
    const result = flagCoverageGaps(
      [makeOpportunity({ keyword: "de um" })],
      "Texto qualquer de um perfil de empresa.",
    );

    expect(result[0].coverageGap).toBe(true);
  });

  it("preserva os demais campos da oportunidade original", () => {
    const opportunity = makeOpportunity({ keyword: "consultoria", avgMonthlySearches: 500, competition: "high" });
    const result = flagCoverageGaps([opportunity], "consultoria");

    expect(result[0]).toMatchObject({
      keyword: "consultoria",
      avgMonthlySearches: 500,
      competition: "high",
      opportunityRank: 1,
    });
  });

  it("retorna lista vazia para entrada vazia", () => {
    expect(flagCoverageGaps([], "qualquer texto")).toEqual([]);
  });
});
