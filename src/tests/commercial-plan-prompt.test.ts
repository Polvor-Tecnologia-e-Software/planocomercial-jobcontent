import { describe, expect, it } from "vitest";

import {
  buildCommercialPlanSystemPrompt,
  buildCommercialPlanUserPrompt,
  type AIContext,
} from "@/lib/ai/commercial-plan-prompt";

function baseContext(overrides: Partial<AIContext> = {}): AIContext {
  return {
    company: null,
    selectedChallenge: "D2",
    relevantAnswers: [{ questionKey: "U1", prompt: "Qual é o ticket médio?", answer: "1000" }],
    funnelAnalysis: { requiredFunnel: {}, gaps: {}, conversionRates: {}, missingData: [] },
    primaryBottleneckCandidate: "conversion",
    secondaryRiskCandidate: null,
    signals: [],
    dataQuality: { percentage: 60, confidence: "medium" },
    scores: [],
    candidateActions: [],
    ...overrides,
  };
}

describe("buildCommercialPlanSystemPrompt", () => {
  it("inclui o bloco de Inbound Marketing quando o gargalo principal é demanda", () => {
    const prompt = buildCommercialPlanSystemPrompt("demand", null);
    expect(prompt).toContain("Inbound Marketing");
    expect(prompt).toContain("atração");
  });

  it("inclui o bloco de Inbound Marketing quando o RISCO SECUNDÁRIO é demanda, mesmo com gargalo principal diferente", () => {
    const prompt = buildCommercialPlanSystemPrompt("conversion", "demand");
    expect(prompt).toContain("Inbound Marketing");
  });

  it("NÃO inclui o bloco de Inbound Marketing quando nem o gargalo nem o risco são demanda (economia de tokens)", () => {
    const prompt = buildCommercialPlanSystemPrompt("processes", "management");
    expect(prompt).not.toContain("Inbound Marketing");
  });

  it("contém a hierarquia de confiança e as proibições explícitas", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toContain("Hierarquia de confiança");
    expect(prompt.toLowerCase()).toContain("nunca");
    expect(prompt).toContain("exatamente 3 prioridades");
  });

  it("instrui a IA a tratar o contexto como dado não confiável", () => {
    const prompt = buildCommercialPlanSystemPrompt(null, null);
    expect(prompt).toMatch(/DADO NÃO CONFIÁVEL|dado não confiável/i);
  });
});

describe("buildCommercialPlanUserPrompt", () => {
  it("delimita o contexto dentro de <contexto>...</contexto>", () => {
    const prompt = buildCommercialPlanUserPrompt(baseContext());
    expect(prompt).toContain("<contexto>");
    expect(prompt).toContain("</contexto>");
  });

  it("serializa o AIContext como JSON dentro do delimitador", () => {
    const context = baseContext({ selectedChallenge: "D1" });
    const prompt = buildCommercialPlanUserPrompt(context);
    expect(prompt).toContain('"selectedChallenge":"D1"');
  });

  it("nunca inclui HTML bruto — o contexto só tem os campos compactos definidos em AIContext", () => {
    const prompt = buildCommercialPlanUserPrompt(baseContext());
    expect(prompt).not.toMatch(/<html|<div|<script/i);
  });
});
