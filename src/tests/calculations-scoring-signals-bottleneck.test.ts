import { describe, expect, it } from "vitest";

import { computeDimensionScores } from "@/lib/calculations/scoring";
import { evaluateSignals } from "@/lib/calculations/signals";
import { identifyBottleneck } from "@/lib/calculations/bottleneck";
import { ALL_DIMENSIONS } from "@/lib/calculations/config";
import type { AnswerMap } from "@/lib/challenges/adaptive-engine";
import type { DetectedSignal, DimensionScoreResult, ScoreResult } from "@/lib/calculations/types";
import type { Dimension } from "@/types/tables";

function makeScoreResult(overrides: Partial<Record<Dimension, Partial<DimensionScoreResult>>>): ScoreResult {
  const dimensions = {} as Record<Dimension, DimensionScoreResult>;
  for (const dimension of ALL_DIMENSIONS) {
    dimensions[dimension] = {
      dimension,
      score: 50,
      weight: 0,
      evidence: [],
      ...overrides[dimension],
    };
  }
  return { dimensions, overallScore: null };
}

// ─── 7. Score ────────────────────────────────────────────────────────────────
describe("computeDimensionScores", () => {
  it("dimensão sem nenhuma pergunta respondida fica neutra (50) com peso 0 — não é 'score ruim'", () => {
    const result = computeDimensionScores({}, "D1");
    for (const dimension of ALL_DIMENSIONS) {
      expect(result.dimensions[dimension].score).toBe(50);
      expect(result.dimensions[dimension].weight).toBe(0);
    }
    expect(result.overallScore).toBeNull();
  });

  it("pontua perguntas de seleção da dimensão do desafio escolhido, com evidência rastreável", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "inbound" };
    const result = computeDimensionScores(answers, "D1");

    expect(result.dimensions.demand.weight).toBe(1);
    expect(result.dimensions.demand.score).toBe(80); // tabela: inbound = 80
    expect(result.dimensions.demand.evidence).toEqual([
      { questionKey: "D1_Q1", answerValue: "inbound", points: 80 },
    ]);
  });

  it("resposta de incerteza conta como neutra (50) uma única vez, não penaliza duas vezes", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "nao_sei" };
    const result = computeDimensionScores(answers, "D1");
    expect(result.dimensions.demand.evidence[0]).toEqual({
      questionKey: "D1_Q1",
      answerValue: "nao_sei",
      points: 50,
    });
    expect(result.dimensions.demand.score).toBe(50);
  });

  it("perguntas numéricas e de texto nunca pontuam (evita benchmark oculto)", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "outbound", U6: 5 };
    const result = computeDimensionScores(answers, "D1");
    expect(result.dimensions.demand.evidence.map((e) => e.questionKey)).toEqual(["D1_Q1"]);
  });

  it("perguntas fora da rota atual não contam, mesmo se uma resposta órfã existir no AnswerMap", () => {
    // D1_Q3 só entra na rota quando D1_Q1 === "nao_sei" — aqui D1_Q1 é "outbound", então D1_Q3 nunca deveria pesar mesmo que uma resposta antiga exista.
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "outbound", D1_Q3: "sim" };
    const result = computeDimensionScores(answers, "D1");
    expect(result.dimensions.demand.evidence.map((e) => e.questionKey)).toEqual(["D1_Q1"]);
  });

  it("média das evidências, arredondada, dentro de 0-100", () => {
    // D5_Q1 sim_atualizado=90, D5_Q2 ninguem=10 -> média 50
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D5_Q1: "sim_atualizado", D5_Q2: "ninguem" };
    const result = computeDimensionScores(answers, "D5");
    expect(result.dimensions.management.score).toBe(50);
    expect(result.dimensions.management.score).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.management.score).toBeLessThanOrEqual(100);
  });

  it("overallScore é a média ponderada só das dimensões com dados (pesos iguais por padrão)", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D6_Q1: "bem_automatizado" };
    const result = computeDimensionScores(answers, "D6");
    expect(result.overallScore).toBe(90); // única dimensão com dado = scale (90)
  });
});

// ─── 8. Sinais ────────────────────────────────────────────────────────────────
describe("evaluateSignals", () => {
  it("DEPENDENCY_REFERRAL dispara quando a fonte de leads é indicação", () => {
    const signals = evaluateSignals({ D1_Q1: "indicacao" }, "D1");
    expect(signals.map((s) => s.code)).toContain("DEPENDENCY_REFERRAL");
  });

  it("não dispara nenhum sinal de D1 quando as respostas são saudáveis", () => {
    const signals = evaluateSignals({ D1_Q1: "inbound", U6: 200 }, "D1");
    expect(signals).toEqual([]);
  });

  it("LOW_NEW_LEADS_VOLUME respeita o limiar configurado (abaixo dispara, acima não) — U6 é universal, dispara independente do desafio", () => {
    expect(evaluateSignals({ U6: 5 }, "D1").map((s) => s.code)).toContain("LOW_NEW_LEADS_VOLUME");
    expect(evaluateSignals({ U6: 100 }, "D1").map((s) => s.code)).not.toContain("LOW_NEW_LEADS_VOLUME");
    expect(evaluateSignals({ U6: 5 }, "D4").map((s) => s.code)).toContain("LOW_NEW_LEADS_VOLUME");
  });

  it("UNCLEAR_ACQUISITION_CHANNEL dispara em 'não sei' com severidade alta", () => {
    const signals = evaluateSignals({ D1_Q1: "nao_sei" }, "D1");
    const signal = signals.find((s) => s.code === "UNCLEAR_ACQUISITION_CHANNEL");
    expect(signal?.severity).toBe("high");
  });

  it("NO_MQL_CRITERIA varia a severidade entre 'não existe' (alta) e 'existe mas não seguido' (média)", () => {
    expect(evaluateSignals({ D2_Q1: "nao" }, "D2").find((s) => s.code === "NO_MQL_CRITERIA")?.severity).toBe(
      "high",
    );
    expect(
      evaluateSignals({ D2_Q1: "existe_nao_seguido" }, "D2").find((s) => s.code === "NO_MQL_CRITERIA")?.severity,
    ).toBe("medium");
    expect(evaluateSignals({ D2_Q1: "sim" }, "D2")).toEqual([]);
  });

  it("STALLED_PROPOSALS escala a severidade conforme o atraso ultrapassa o limiar", () => {
    expect(evaluateSignals({ D3_Q2: 10 }, "D3")).toEqual([]); // abaixo do limiar
    expect(
      evaluateSignals({ D3_Q2: 35 }, "D3").find((s) => s.code === "STALLED_PROPOSALS")?.severity,
    ).toBe("medium");
    expect(
      evaluateSignals({ D3_Q2: 90 }, "D3").find((s) => s.code === "STALLED_PROPOSALS")?.severity,
    ).toBe("high");
  });

  it("cada sinal carrega evidência rastreável (questionKey + answerValue)", () => {
    const signals = evaluateSignals({ D6_Q1: "quase_tudo_manual" }, "D6");
    expect(signals[0].evidence).toEqual([{ questionKey: "D6_Q1", answerValue: "quase_tudo_manual" }]);
  });
});

// ─── 9. Identificação de gargalo ──────────────────────────────────────────────
describe("identifyBottleneck", () => {
  it("sem nenhuma dimensão com evidência, não aponta candidato", () => {
    const result = identifyBottleneck(makeScoreResult({}), [], "D1");
    expect(result.primaryBottleneckCandidate).toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("confirma a dimensão do desafio selecionado quando a própria evidência dela sustenta um problema", () => {
    const score = makeScoreResult({ demand: { score: 30, weight: 2 } });
    const signals: DetectedSignal[] = [
      { code: "DEPENDENCY_REFERRAL", dimension: "demand", severity: "high", evidence: [] },
      { code: "LOW_NEW_LEADS_VOLUME", dimension: "demand", severity: "medium", evidence: [] },
    ];
    const result = identifyBottleneck(score, signals, "D1");
    expect(result.primaryBottleneckCandidate).toBe("demand");
    expect(result.confidence).toBe("high");
    expect(result.supportingSignals).toEqual(["DEPENDENCY_REFERRAL", "LOW_NEW_LEADS_VOLUME"]);
  });

  it("ainda aponta a dimensão do desafio selecionado (com confiança baixa) quando a evidência dela é saudável — nunca 'não identificado' havendo dado real", () => {
    // Usuário escolheu D1 (demanda), respostas de demanda são boas: score alto, sem sinais.
    const score = makeScoreResult({ demand: { score: 85, weight: 1 } });
    const result = identifyBottleneck(score, [], "D1");
    // impacto = 100 - 85 = 15, abaixo do limiar (30) -> confiança baixa, mas
    // ainda é o único candidato com dado real, então é apontado mesmo assim.
    expect(result.primaryBottleneckCandidate).toBe("demand");
    expect(result.confidence).toBe("low");
  });

  it("conflito selectedChallenge x evidências: escolhe a dimensão com mais impacto real, não a declarada pelo usuário", () => {
    // Usuário diz que faltam leads (selectedChallenge = D1/demand), mas os
    // dados (hipotéticos/sintéticos) mostram demanda saudável e conversão
    // com problema sério — o sistema deve apontar conversão, não demanda.
    const score = makeScoreResult({
      demand: { score: 90, weight: 2 }, // saudável
      conversion: { score: 20, weight: 3 }, // problemático
    });
    const signals: DetectedSignal[] = [
      { code: "NO_MQL_CRITERIA", dimension: "conversion", severity: "high", evidence: [] },
      { code: "STALLED_PROPOSALS", dimension: "conversion", severity: "high", evidence: [] },
    ];

    const result = identifyBottleneck(score, signals, "D1");

    expect(result.primaryBottleneckCandidate).toBe("conversion");
    expect(result.primaryBottleneckCandidate).not.toBe("demand");
  });

  it("aponta um candidato secundário quando uma segunda dimensão também tem impacto relevante", () => {
    const score = makeScoreResult({
      conversion: { score: 20, weight: 3 },
      processes: { score: 35, weight: 2 },
    });
    const signals: DetectedSignal[] = [
      { code: "NO_MQL_CRITERIA", dimension: "conversion", severity: "high", evidence: [] },
      { code: "NO_SALES_PLAYBOOK", dimension: "processes", severity: "medium", evidence: [] },
    ];

    const result = identifyBottleneck(score, signals, "D2");

    expect(result.primaryBottleneckCandidate).toBe("conversion");
    expect(result.secondaryRiskCandidate).toBe("processes");
  });

  it("a trilha de decisão (rationale) é legível e não vazia quando há candidato", () => {
    const score = makeScoreResult({ demand: { score: 20, weight: 2 } });
    const result = identifyBottleneck(
      score,
      [{ code: "DEPENDENCY_REFERRAL", dimension: "demand", severity: "high", evidence: [] }],
      "D1",
    );
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});
