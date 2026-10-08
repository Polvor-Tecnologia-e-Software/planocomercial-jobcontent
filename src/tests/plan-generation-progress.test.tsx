import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentStepIndex,
  PLAN_GENERATION_STEPS,
  PlanGenerationProgress,
  progressPercent,
} from "@/components/result/plan-generation-progress";

describe("currentStepIndex", () => {
  it("começa na primeira etapa e avança conforme o tempo", () => {
    expect(currentStepIndex(0)).toBe(0);
    expect(currentStepIndex(9)).toBe(1);
    expect(currentStepIndex(40)).toBe(3);
  });

  it("para na última etapa ('Finalizando') e nunca passa dela, por mais que demore", () => {
    const last = PLAN_GENERATION_STEPS.length - 1;
    expect(currentStepIndex(85)).toBe(last);
    expect(currentStepIndex(600)).toBe(last);
  });
});

describe("progressPercent", () => {
  it("cresce com o tempo e nunca chega a 100% sozinho", () => {
    expect(progressPercent(0)).toBe(0);
    expect(progressPercent(30)).toBeGreaterThan(progressPercent(10));
    expect(progressPercent(10_000)).toBeLessThanOrEqual(95);
  });
});

describe("PlanGenerationProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra todas as etapas e marca a atual, avançando com o tempo", () => {
    render(<PlanGenerationProgress />);

    for (const step of PLAN_GENERATION_STEPS) {
      expect(screen.getByText(step.label, { exact: false })).toBeInTheDocument();
    }
    expect(screen.getByText("Analisando o seu funil comercial", { exact: false }).closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );

    act(() => {
      vi.advanceTimersByTime(36_000);
    });

    expect(screen.getByText("Escrevendo os conteúdos do Mês 1", { exact: false }).closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByText("Isso pode levar de 1 a 2 minutos — não feche esta página.")).toBeInTheDocument();
  });
});
