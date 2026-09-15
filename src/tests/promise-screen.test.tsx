import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PromiseScreen } from "@/components/diagnostic/promise-screen";

describe("PromiseScreen — hero", () => {
  it("exibe a headline principal como único h1 da tela", () => {
    render(<PromiseScreen onStart={() => {}} />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(
      "Descubra o que está impedindo sua empresa de crescer e receba um plano comercial para os próximos 90 dias.",
    );
  });

  it("exibe a subheadline", () => {
    render(<PromiseScreen onStart={() => {}} />);
    expect(
      screen.getByText(/descubra onde estão seus gargalos, o que precisa mudar/i),
    ).toBeInTheDocument();
  });

  it("exibe o texto de apoio do CTA do hero", () => {
    render(<PromiseScreen onStart={() => {}} />);
    expect(
      screen.getByText("Diagnóstico personalizado para empresas B2B. Leva poucos minutos."),
    ).toBeInTheDocument();
  });

  it("mostra a ilustração do iceberg com as 4 etapas (Vendas, Demanda, Conversão, Escala)", () => {
    render(<PromiseScreen onStart={() => {}} />);
    expect(
      screen.getByRole("img", { name: /ilustração de um iceberg/i }),
    ).toBeInTheDocument();
    // "Demanda"/"Conversão"/"Escala" também aparecem como título dos
    // cartões de pilares mais abaixo na mesma tela — por isso getAllByText
    // (>= 1), não getByText, aqui.
    for (const label of ["Vendas", "Demanda", "Conversão", "Escala"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Gargalo identificado")).toBeInTheDocument();
  });
});

describe("PromiseScreen — CTAs", () => {
  it("tem os 3 CTAs 'Criar meu Plano Comercial' (hero, pilares, fechamento), todos chamando onStart", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<PromiseScreen onStart={onStart} />);

    const ctas = screen.getAllByRole("button", { name: "Criar meu Plano Comercial" });
    expect(ctas).toHaveLength(3);

    await user.click(ctas[0]);
    expect(onStart).toHaveBeenCalledTimes(1);

    await user.click(ctas[ctas.length - 1]);
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("todo CTA é um <button> real (navegável por teclado, sem depender de hover)", () => {
    render(<PromiseScreen onStart={() => {}} />);
    const ctas = screen.getAllByRole("button", { name: "Criar meu Plano Comercial" });
    for (const cta of ctas) {
      expect(cta.tagName).toBe("BUTTON");
    }
  });
});

describe("PromiseScreen — problema e pilares", () => {
  it("mostra o título e o texto do problema", () => {
    render(<PromiseScreen onStart={() => {}} />);
    expect(
      screen.getByRole("heading", {
        name: "Sua meta de vendas pode estar clara. O caminho até ela, nem tanto.",
      }),
    ).toBeInTheDocument();
  });

  it("mostra os 3 pilares (Demanda, Conversão, Escala) com índice e texto", () => {
    render(<PromiseScreen onStart={() => {}} />);

    expect(screen.getByRole("heading", { name: "Demanda" })).toBeInTheDocument();
    expect(
      screen.getByText(/gerando oportunidades suficientes/),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Conversão" })).toBeInTheDocument();
    expect(screen.getByText(/oportunidades estão se perdendo/)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Escala" })).toBeInTheDocument();
    expect(screen.getByText(/sustentar o crescimento/)).toBeInTheDocument();

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});

describe("PromiseScreen — entregáveis e fechamento", () => {
  it("mostra o título e os 3 entregáveis", () => {
    render(<PromiseScreen onStart={() => {}} />);

    expect(
      screen.getByRole("heading", {
        name: "Mais do que um diagnóstico. Um plano do que fazer a partir dele.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Identificação do seu principal gargalo de crescimento"),
    ).toBeInTheDocument();
    expect(screen.getByText("Plano de ação dividido em 30, 60 e 90 dias")).toBeInTheDocument();
    expect(
      screen.getByText("Checklist com as ações prioritárias para os próximos 7 dias"),
    ).toBeInTheDocument();
  });

  it("mostra o cartão de fechamento com o aviso de LGPD/anti-spam", () => {
    render(<PromiseScreen onStart={() => {}} />);

    expect(
      screen.getByRole("heading", { name: "Pare de decidir o próximo passo comercial no achismo." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/você não entra em nenhuma sequência de vendas automática/),
    ).toBeInTheDocument();
  });
});

describe("PromiseScreen — hierarquia de headings", () => {
  it("tem exatamente um h1 e pelo menos dois h2 (problema, fechamento)", () => {
    render(<PromiseScreen onStart={() => {}} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(2);
  });
});
