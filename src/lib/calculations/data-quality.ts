/**
 * Seção 6: qualidade dos dados. NÃO é o mesmo que o score de maturidade
 * (seção 7) — aqui mede-se o quão completo e confiável é o INSUMO que
 * chegou até o motor, não a saúde comercial da empresa. Uma empresa em
 * estágio inicial com todas as perguntas respondidas com confiança tem
 * qualidade de dados alta mesmo que o score de maturidade seja baixo.
 */
import { getApplicableRoute, isQuestionAnswered, type AnswerMap } from "@/lib/challenges/adaptive-engine";
import {
  CRITICAL_METRIC_QUESTION_KEYS,
  DATA_QUALITY_CONFIDENCE_BANDS,
  DATA_QUALITY_WEIGHTS,
  UNCERTAIN_ANSWER_VALUES,
} from "@/lib/calculations/config";
import { clamp, roundToInt } from "@/lib/calculations/rounding";
import type { DataQualityResult } from "@/lib/calculations/types";
import type { ConfidenceLevel, SelectedChallenge } from "@/types/tables";

function confidenceFromPercentage(percentage: number): ConfidenceLevel {
  if (percentage >= DATA_QUALITY_CONFIDENCE_BANDS.high) return "high";
  if (percentage >= DATA_QUALITY_CONFIDENCE_BANDS.medium) return "medium";
  return "low";
}

export function computeDataQuality(
  answers: AnswerMap,
  selectedChallenge: SelectedChallenge | null,
  /** 0-100 — ver reverse-engineering.computeFunnelCompletenessPercentage. 0 quando ainda não calculado. */
  funnelCompletenessPercentage = 0,
): DataQualityResult {
  if (!selectedChallenge) {
    return {
      dataQualityPercentage: 0,
      confidence: "low",
      applicableCount: 0,
      answeredCount: 0,
      uncertainCount: 0,
      criticalMetricsAvailable: 0,
      criticalMetricsTotal: CRITICAL_METRIC_QUESTION_KEYS.length,
    };
  }

  const route = getApplicableRoute(selectedChallenge, answers);
  const applicableCount = route.length;

  let answeredCount = 0;
  let uncertainCount = 0;
  for (const item of route) {
    const value = answers[item.key];
    if (!isQuestionAnswered(value)) continue;
    answeredCount += 1;
    if (typeof value === "string" && UNCERTAIN_ANSWER_VALUES.has(value)) {
      uncertainCount += 1;
    }
  }

  const criticalMetricsAvailable = CRITICAL_METRIC_QUESTION_KEYS.filter((key) =>
    isQuestionAnswered(answers[key]),
  ).length;

  const completeness = applicableCount === 0 ? 0 : answeredCount / applicableCount;
  const certainty = answeredCount === 0 ? 0 : (answeredCount - uncertainCount) / answeredCount;
  const criticalMetrics =
    CRITICAL_METRIC_QUESTION_KEYS.length === 0
      ? 1
      : criticalMetricsAvailable / CRITICAL_METRIC_QUESTION_KEYS.length;

  const funnelCompleteness = clamp(funnelCompletenessPercentage, 0, 100) / 100;

  const weightedScore =
    completeness * DATA_QUALITY_WEIGHTS.completeness +
    certainty * DATA_QUALITY_WEIGHTS.certainty +
    criticalMetrics * DATA_QUALITY_WEIGHTS.criticalMetrics +
    funnelCompleteness * DATA_QUALITY_WEIGHTS.funnelCompleteness;

  const dataQualityPercentage = roundToInt(weightedScore * 100);

  return {
    dataQualityPercentage,
    confidence: confidenceFromPercentage(dataQualityPercentage),
    applicableCount,
    answeredCount,
    uncertainCount,
    criticalMetricsAvailable,
    criticalMetricsTotal: CRITICAL_METRIC_QUESTION_KEYS.length,
  };
}
