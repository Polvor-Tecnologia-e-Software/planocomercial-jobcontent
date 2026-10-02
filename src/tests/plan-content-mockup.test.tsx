import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentMockup } from "@/components/result/plan-content-mockup";

describe("ContentMockup", () => {
  it("mostra só o rótulo e o título reais — nunca inventa logotipo", () => {
    render(<ContentMockup eyebrow="ebook" title="Guia de Especificação de Válvulas" />);
    expect(screen.getByText("ebook")).toBeInTheDocument();
    expect(screen.getByText("Guia de Especificação de Válvulas")).toBeInTheDocument();
  });

  it("mostra o nome real da empresa no rodapé da capa quando informado (dado real da tela, não uma invenção)", () => {
    render(
      <ContentMockup
        eyebrow="ebook"
        title="Guia de Especificação de Válvulas"
        companyName="Aurora Válvulas Industriais"
      />,
    );
    expect(screen.getByText("Aurora Válvulas Industriais")).toBeInTheDocument();
  });

  it("não mostra nenhum nome de empresa quando companyName não é informado", () => {
    render(<ContentMockup eyebrow="ebook" title="Guia de Especificação de Válvulas" />);
    expect(screen.queryByText(/Válvulas Industriais/)).not.toBeInTheDocument();
  });
});
