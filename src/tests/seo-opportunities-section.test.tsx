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

  it("mostra o selo, o título e deixa claro que os volumes são estimativas da IA", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity()]} />);
    expect(screen.getByText("04 · Oportunidades")).toBeInTheDocument();
    expect(screen.getByText("Palavras-chave para a sua empresa")).toBeInTheDocument();
    expect(screen.getByText(/Não são números oficiais do Google/)).toBeInTheDocument();
    expect(screen.getByText("Buscas/mês (est.)")).toBeInTheDocument();
  });

  it("mostra o status 'Nicho não explorado' só nas palavras-chave com coverageGap true", () => {
    render(
      <SeoOpportunitiesSection
        opportunities={[
          makeOpportunity({ keyword: "consultoria financeira", coverageGap: false }),
          makeOpportunity({ keyword: "planejamento tributário", coverageGap: true, opportunityRank: 2 }),
        ]}
      />,
    );

    expect(screen.getAllByText("Nicho não explorado")).toHaveLength(1);
  });

  it("só explica os nichos marcados no texto de apoio quando existe pelo menos um", () => {
    const { rerender } = render(
      <SeoOpportunitiesSection opportunities={[makeOpportunity({ coverageGap: true })]} />,
    );
    expect(screen.getByText(/Os temas marcados ainda não aparecem no site/)).toBeInTheDocument();

    rerender(<SeoOpportunitiesSection opportunities={[makeOpportunity({ coverageGap: false })]} />);
    expect(screen.queryByText(/Os temas marcados ainda não aparecem no site/)).not.toBeInTheDocument();
  });

  it("mostra a palavra-chave, o volume estimado e a concorrência em cada linha", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity()]} />);

    expect(screen.getByText("consultoria financeira")).toBeInTheDocument();
    expect(screen.getByText("~1.000")).toBeInTheDocument();
    expect(screen.getByText("Baixa")).toBeInTheDocument();
  });

  it("mostra 'Não disponível' quando avgMonthlySearches é null, sem inventar volume", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity({ avgMonthlySearches: null })]} />);
    expect(screen.getByText("Não disponível")).toBeInTheDocument();
  });

  it("traz o CTA de WhatsApp para falar com especialista em SEO", () => {
    render(<SeoOpportunitiesSection opportunities={[makeOpportunity()]} />);
    const link = screen.getByRole("link", { name: /Falar com especialista em SEO/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
    expect(link).toHaveAttribute("target", "_blank");
  });
});
