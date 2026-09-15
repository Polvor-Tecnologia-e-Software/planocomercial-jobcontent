import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeoOpportunitiesSection } from "@/components/result/seo-opportunities-section";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";

function makeOpportunity(overrides: Partial<KeywordOpportunity> = {}): KeywordOpportunity {
  return {
    keyword: "consultoria financeira",
    avgMonthlySearches: 1000,
    competition: "low",
    opportunityRank: 1,
    coverageGap: false,
    ...overrides,
  };
}

describe("SeoOpportunitiesSection", () => {
  it("não renderiza nada quando a lista de oportunidades está vazia", () => {
    const { container } = render(<SeoOpportunitiesSection opportunities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o selo de 'oportunidade de nicho não explorada' só nas palavras-chave com coverageGap true", () => {
    render(
      <SeoOpportunitiesSection
        opportunities={[
          makeOpportunity({ keyword: "consultoria financeira", coverageGap: false }),
          makeOpportunity({ keyword: "planejamento tributário", coverageGap: true, opportunityRank: 2 }),
        ]}
      />,
    );

    const badges = screen.getAllByText("Oportunidade de nicho não explorada");
    expect(badges).toHaveLength(1);
  });

  it("menciona quantas oportunidades são de nicho no texto de apoio quando existe pelo menos uma", () => {
    render(
      <SeoOpportunitiesSection
        opportunities={[
          makeOpportunity({ keyword: "consultoria financeira", coverageGap: true, opportunityRank: 1 }),
          makeOpportunity({ keyword: "planejamento tributário", coverageGap: true, opportunityRank: 2 }),
        ]}
      />,
    );

    expect(screen.getByText(/2 delas ainda não aparecem no perfil da sua empresa/)).toBeInTheDocument();
  });

  it("não menciona oportunidades de nicho no texto de apoio quando nenhuma tem coverageGap", () => {
    render(
      <SeoOpportunitiesSection
        opportunities={[makeOpportunity({ coverageGap: false })]}
      />,
    );

    expect(screen.queryByText(/ainda não aparece/)).not.toBeInTheDocument();
  });

  it("mostra o volume de busca e a concorrência de cada palavra-chave", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity()]} />);

    expect(screen.getByText("consultoria financeira")).toBeInTheDocument();
    expect(screen.getByText("~1.000 buscas/mês (estimativa da IA)")).toBeInTheDocument();
    expect(screen.getByText("Concorrência baixa")).toBeInTheDocument();
  });

  it("mostra 'Volume de busca não disponível' quando avgMonthlySearches é null", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity({ avgMonthlySearches: null })]} />);
    expect(screen.getByText("Volume de busca não disponível")).toBeInTheDocument();
  });
});
