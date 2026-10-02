import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanLockedTeaser } from "@/components/result/plan-locked-teaser";

describe("PlanLockedTeaser", () => {
  it("mostra o selo 'Bloqueadas' e o CTA de WhatsApp para desbloquear", () => {
    render(<PlanLockedTeaser monthLabel="Mês 1" actionsCount={6} />);
    expect(screen.getByText("Bloqueadas")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Desbloquear pelo WhatsApp/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
  });

  it("reflete o mês recebido no título, com o total real de cartões bloqueados (abas de plan-month-detail.tsx)", () => {
    render(<PlanLockedTeaser monthLabel="Mês 2" actionsCount={6} />);
    expect(screen.getByText("Mais 6 sugestões para o Mês 2")).toBeInTheDocument();
  });

  it("mostra os cartões de sugestão com o conteúdo borrado (nunca gera conteúdo novo de IA)", () => {
    render(<PlanLockedTeaser monthLabel="Mês 1" actionsCount={6} />);
    expect(screen.getByText("4 pautas extras de blog")).toBeInTheDocument();
    expect(screen.getByText("Textos completos da LP")).toBeInTheDocument();
  });

  it("mostra o total real de ações do mês no CTA de execução, nunca um número inventado", () => {
    render(<PlanLockedTeaser monthLabel="Mês 1" actionsCount={7} />);
    expect(
      screen.getByText("São 7 ações só neste mês. Quer que a Job Content execute com você?"),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Quero ajuda para executar/ });
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain("7 ações");
  });
});
