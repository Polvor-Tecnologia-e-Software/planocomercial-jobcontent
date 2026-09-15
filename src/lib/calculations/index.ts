/**
 * Ponto único de entrada do motor determinístico de cálculos. Pura — não
 * toca o banco; recebe um AnswerMap (já lido de diagnostic_answers pelo
 * chamador) e o desafio selecionado, devolve tudo calculado. A
 * persistência (diagnostics/diagnostic_scores/diagnostic_signals/
 * funnel_analyses) é responsabilidade do caso de uso server-side em
 * src/server/run-deterministic-analysis.ts, não deste módulo.
 */
import type { AnswerMap } from "@/lib/challenges/adaptive-engine";
import { computeDataQuality } from "@/lib/calculations/data-quality";
import { computeFunnelGaps } from "@/lib/calculations/gaps";
import { extractCommercialMetrics } from "@/lib/calculations/normalize-metrics";
import { computeConversionRates } from "@/lib/calculations/rates";
import {
  computeFunnelCompletenessPercentage,
  computeGoalReverseEngineering,
} from "@/lib/calculations/reverse-engineering";
import { computeDimensionScores } from "@/lib/calculations/scoring";
import { evaluateSignals } from "@/lib/calculations/signals";
import { identifyBottleneck } from "@/lib/calculations/bottleneck";
import type { DeterministicAnalysisResult } from "@/lib/calculations/types";
import type { SelectedChallenge } from "@/types/tables";

export function runDeterministicCalculations(
  answers: AnswerMap,
  selectedChallenge: SelectedChallenge | null,
): DeterministicAnalysisResult {
  const metrics = extractCommercialMetrics(answers, selectedChallenge);
  const rates = computeConversionRates(metrics);
  const reverseEngineering = computeGoalReverseEngineering(metrics, rates);
  const funnelCompletenessPercentage = computeFunnelCompletenessPercentage(reverseEngineering);
  const gaps = computeFunnelGaps(metrics, reverseEngineering);
  const dataQuality = computeDataQuality(answers, selectedChallenge, funnelCompletenessPercentage);
  const score = computeDimensionScores(answers, selectedChallenge);
  const signals = evaluateSignals(answers, selectedChallenge);
  const bottleneck = identifyBottleneck(score, signals, selectedChallenge);

  return {
    metrics,
    rates,
    reverseEngineering,
    funnelCompletenessPercentage,
    gaps,
    dataQuality,
    score,
    signals,
    bottleneck,
  };
}

export * from "@/lib/calculations/types";
export { computeDataQuality } from "@/lib/calculations/data-quality";
export { computeFunnelGaps } from "@/lib/calculations/gaps";
export { extractCommercialMetrics } from "@/lib/calculations/normalize-metrics";
export { computeConversionRates, computeRateFromCounts } from "@/lib/calculations/rates";
export {
  computeGoalReverseEngineering,
  computeFunnelCompletenessPercentage,
} from "@/lib/calculations/reverse-engineering";
export { computeDimensionScores } from "@/lib/calculations/scoring";
export { evaluateSignals } from "@/lib/calculations/signals";
export { identifyBottleneck } from "@/lib/calculations/bottleneck";
export { simulateConversionChange, InvalidSimulationInputError } from "@/lib/calculations/simulation";
