import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrioritiesSection } from "@/components/result/priorities-section";
import type { Priority } from "@/schemas/commercial-plan";

function makePriority(overrides: Partial<Priority> = {}): Priority {
  return {
    title: "Formalizar critério de qualificação",
    rationale: "Motivo",
    problemSolved: "Problema",
    expectedImpact: "Impacto",
    primaryIndicator: "Indicador",
    timeframe: "30 dias",
    ...overrides,
  };
}

describe("PrioritiesSection — CTA de WhatsApp por prioridade", () => {
  it("cada prioridade tem um link de WhatsApp mencionando o título dela", () => {
    render(
      <PrioritiesSection
        priorities={[
          makePriority({ title: "Prioridade A" }),
          makePriority({ title: "Prioridade B" }),
        ]}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Falar com um especialista" });
    expect(links).toHaveLength(2);

    expect(links[0]).toHaveAttribute("href", expect.stringContaining("https://wa.me/554998280798"));
    expect(decodeURIComponent(links[0].getAttribute("href") ?? "")).toContain("Prioridade A");
    expect(decodeURIComponent(links[1].getAttribute("href") ?? "")).toContain("Prioridade B");

    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
