import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "@/components/result/hero-section";

function renderHero(overrides: Partial<ComponentProps<typeof HeroSection>> = {}) {
  return render(
    <HeroSection
      companyName="CodeBit"
      generatedAt="2026-01-05T00:00:00.000Z"
      executiveDiagnosis="A empresa perde oportunidades por falta de critério de qualificação de leads."
      primaryBottleneck="conversion"
      dataQualityPercentage={60}
      confidence="medium"
      leadsCurrent={22}
      leadsRequired={45}
      {...overrides}
    />,
  );
}

describe("HeroSection", () => {
  it("mostra o selo de diagnóstico concluído, a data e o nome da empresa", () => {
    renderHero();
    expect(screen.getByText("Diagnóstico concluído")).toBeInTheDocument();
    expect(screen.getByText("CodeBit")).toBeInTheDocument();
  });

  it("mostra os 4 cartões — gargalo, leads por mês, qualidade dos dados e confiança — sem inventar número", () => {
    renderHero();
    expect(screen.getByText("Principal gargalo")).toBeInTheDocument();
    expect(screen.getByText("Leads por mês")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("de 45 necessários")).toBeInTheDocument();
    expect(screen.getByText("Qualidade dos dados")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("Confiança do diagnóstico")).toBeInTheDocument();
  });

  it("mostra — no lugar de um número, sem inventar, quando leads por mês não pôde ser calculado", () => {
    renderHero({ leadsCurrent: null, leadsRequired: null });
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/necessários/)).not.toBeInTheDocument();
  });

  it("traz os dois CTAs: WhatsApp (nova aba) e âncora para o plano de 90 dias", () => {
    renderHero();
    const whatsappLink = screen.getByRole("link", { name: /Falar com um especialista/ });
    expect(whatsappLink).toHaveAttribute("href", expect.stringContaining("wa.me"));
    expect(whatsappLink).toHaveAttribute("target", "_blank");

    const planLink = screen.getByRole("link", { name: /Ver plano de 90 dias/ });
    expect(planLink).toHaveAttribute("href", "#plano");
  });
});
