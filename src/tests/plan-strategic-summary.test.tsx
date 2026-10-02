import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanStrategicSummary } from "@/components/result/plan-strategic-summary";
import type { StrategicSummary } from "@/schemas/commercial-plan";

function makeSummary(overrides: Partial<StrategicSummary> = {}): StrategicSummary {
  return {
    headline: "Construir um canal digital próprio que gere leads qualificados.",
    positioning: "Fabricante nacional com engenharia de aplicação.",
    channelStrategy: "Google captura quem já procura; LinkedIn alcança decisores.",
    contentJourney: "Topo educa, meio compara, material rico converte.",
    mediaBudgetPriority: [
      { channel: "Google Ads", priority: "alta" },
      { channel: "LinkedIn Ads", priority: "media" },
    ],
    commercialProcess: "MQL definido por perfil + interesse, SLA de 2 horas úteis.",
    premises: "Verba de mídia disponível e aprovação de conteúdo em até 3 dias.",
    ...overrides,
  };
}

describe("PlanStrategicSummary", () => {
  it("mostra o headline e as seis seções do resumo estratégico", () => {
    render(<PlanStrategicSummary summary={makeSummary()} />);
    expect(
      screen.getByText("Construir um canal digital próprio que gere leads qualificados."),
    ).toBeInTheDocument();
    expect(screen.getByText("Posicionamento")).toBeInTheDocument();
    expect(screen.getByText("Estratégia de canais")).toBeInTheDocument();
    expect(screen.getByText("Jornada de conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Distribuição de verba de mídia")).toBeInTheDocument();
    expect(screen.getByText("Processo comercial")).toBeInTheDocument();
    expect(screen.getByText("Premissas")).toBeInTheDocument();
  });

  it("nunca exibe a porcentagem de verba vinda da IA — sempre calcula a partir da prioridade qualitativa", () => {
    render(
      <PlanStrategicSummary
        summary={makeSummary({
          mediaBudgetPriority: [
            { channel: "Google Ads", priority: "alta" },
            { channel: "Meta Ads", priority: "alta" },
          ],
        })}
      />,
    );
    // Duas prioridades iguais (alta/alta) => split 50/50, nunca um valor que a IA tivesse escrito.
    expect(screen.getByText(/Google Ads 50%/)).toBeInTheDocument();
    expect(screen.getByText(/Meta Ads 50%/)).toBeInTheDocument();
  });

  it("tem um CTA de WhatsApp para validar a estratégia com um especialista", () => {
    render(<PlanStrategicSummary summary={makeSummary()} />);
    const link = screen.getByRole("link", { name: /Validar com um especialista/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/"));
  });
});
