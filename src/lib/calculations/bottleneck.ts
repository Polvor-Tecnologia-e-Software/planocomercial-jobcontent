/**
 * Seção 9: identificação do gargalo provável.
 *
 * selectedChallenge é uma PISTA declarada pela pessoa usuária, nunca a
 * resposta automática. O candidato a gargalo só vem de dimensões que
 * realmente têm evidência (score.weight > 0 — "perguntas fora da rota são
 * neutras", nunca candidatas). Entre as dimensões com evidência, calcula
 * um "impacto" combinando a saúde da dimensão (inverso do score) com a
 * severidade dos sinais detectados nela, e SEMPRE aponta a de maior
 * impacto como candidato principal — nunca "não identificado" quando há
 * ao menos uma dimensão com dado real (decisão de produto: entre
 * dimensões já avaliadas de verdade, escolher a mais provável não é
 * "inventar um número", é diferente de fabricar um dado que não existe).
 * MIN_IMPACT_TO_QUALIFY deixou de ser um gate binário e agora só alimenta
 * o nível de "confidence" do resultado (low quando o impacto é fraco) e o
 * candidato secundário — a UI/PDF decidem como comunicar baixa confiança,
 * nunca omitem o gargalo principal.
 *
 * Hoje, como só a dimensão do desafio escolhido tem evidência real (ver
 * aviso em scoring.ts), a comparação entre dimensões diferentes só ocorre
 * de fato quando mais de uma dimensão tiver score.weight > 0 — o que a
 * função já faz corretamente, testado aqui com dados sintéticos, mas que
 * só vai acontecer com dados reais quando o catálogo cobrir mais de um
 * desafio por diagnóstico.
 */
import { BOTTLENECK } from "@/lib/calculations/config";
import type { BottleneckResult, DetectedSignal, ScoreResult } from "@/lib/calculations/types";
import type { Dimension, SelectedChallenge } from "@/types/tables";

type DimensionImpact = {
  dimension: Dimension;
  impact: number;
  signalCount: number;
};

function computeImpact(
  dimension: Dimension,
  score: ScoreResult,
  signals: readonly DetectedSignal[],
): DimensionImpact {
  const dimensionSignals = signals.filter((signal) => signal.dimension === dimension);
  const signalImpact = dimensionSignals.reduce(
    (total, signal) => total + BOTTLENECK.SEVERITY_WEIGHT[signal.severity],
    0,
  );
  const healthScore = score.dimensions[dimension].score;
  const impact = 100 - healthScore + signalImpact * BOTTLENECK.SIGNAL_IMPACT_MULTIPLIER;

  return { dimension, impact, signalCount: dimensionSignals.length };
}

export function identifyBottleneck(
  score: ScoreResult,
  signals: readonly DetectedSignal[],
  selectedChallenge: SelectedChallenge | null,
): BottleneckResult {
  const rationale: string[] = [];

  const dimensionsWithEvidence = (Object.keys(score.dimensions) as Dimension[]).filter(
    (dimension) => score.dimensions[dimension].weight > 0,
  );

  if (dimensionsWithEvidence.length === 0) {
    rationale.push("Nenhuma dimensão tem evidência suficiente (nenhuma pergunta de seleção respondida ainda).");
    return {
      primaryBottleneckCandidate: null,
      secondaryRiskCandidate: null,
      supportingSignals: [],
      confidence: "low",
      rationale,
    };
  }

  const impacts = dimensionsWithEvidence
    .map((dimension) => computeImpact(dimension, score, signals))
    .sort((a, b) => b.impact - a.impact);

  for (const item of impacts) {
    rationale.push(
      `Dimensão "${item.dimension}": impacto ${item.impact} (score ${score.dimensions[item.dimension].score}, ${item.signalCount} sinal(is)).`,
    );
  }

  const top = impacts[0];
  const strongEvidence = top.impact >= BOTTLENECK.MIN_IMPACT_TO_QUALIFY;

  if (selectedChallenge) {
    rationale.push(
      strongEvidence && dimensionsWithEvidence.length === 1
        ? `O desafio selecionado ("${selectedChallenge}") tem evidência que confirma um impacto relevante (${top.impact}).`
        : !strongEvidence
          ? `O desafio selecionado tem evidência (impacto ${top.impact}), abaixo do limiar de forte confirmação (${BOTTLENECK.MIN_IMPACT_TO_QUALIFY}) — ainda assim apontado como principal candidato, por ser a dimensão com dado real disponível, com confiança baixa.`
          : "Mais de uma dimensão tem evidência — o candidato a gargalo é escolhido pelo maior impacto, não automaticamente pelo desafio selecionado.",
    );
  }

  // Sempre a dimensão de maior impacto — nunca null quando existe ao menos
  // uma dimensão com evidência real (ver comentário no topo do arquivo).
  const primaryBottleneckCandidate = top.dimension;

  const second = impacts[1];
  const secondaryRiskCandidate =
    second && second.impact >= BOTTLENECK.MIN_IMPACT_TO_QUALIFY / 2 ? second.dimension : null;

  const supportingSignals = signals
    .filter((signal) => signal.dimension === primaryBottleneckCandidate)
    .map((signal) => signal.code);

  let confidence: BottleneckResult["confidence"] = "low";
  const primaryWeight = score.dimensions[primaryBottleneckCandidate].weight;
  if (top.signalCount >= 2 && primaryWeight >= 2) {
    confidence = "high";
  } else if (top.signalCount >= 1 || primaryWeight >= 2) {
    confidence = "medium";
  }

  return {
    primaryBottleneckCandidate,
    secondaryRiskCandidate,
    supportingSignals,
    confidence,
    rationale,
  };
}
