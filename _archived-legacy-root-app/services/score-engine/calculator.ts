import type { DiagnosticAnswer, DiagnosticQuestion, ScoreLevel } from "@/types";
import type { AnswerMap, PillarDetail, ScoredQuestion } from "./types";
import { PILLAR_WEIGHTS, SCORE_THRESHOLDS, SCORE_LEVEL_META } from "./constants";

// ─── Build lookup map from answer array ──────────────────────────────────────
export function buildAnswerMap(answers: DiagnosticAnswer[]): AnswerMap {
  return new Map(answers.map((a) => [a.question_id, a]));
}

// ─── Score level classifier ───────────────────────────────────────────────────
export function classifyScore(score: number): ScoreLevel {
  for (const [level, range] of Object.entries(SCORE_THRESHOLDS) as [ScoreLevel, { min: number; max: number }][]) {
    if (score >= range.min && score <= range.max) return level;
  }
  return "critico";
}

// ─── Points needed to reach next level ───────────────────────────────────────
export function pointsToNextLevel(score: number, level: ScoreLevel): number {
  const meta = SCORE_LEVEL_META[level];
  if (!meta.next) return 0;
  const nextRange = SCORE_THRESHOLDS[meta.next];
  return Math.max(0, nextRange.min - score);
}

// ─── Score a single pillar ────────────────────────────────────────────────────
export function scorePillar(
  pillar: "demanda" | "conversao" | "escala",
  answers: DiagnosticAnswer[],
  questions: DiagnosticQuestion[]
): PillarDetail {
  const pillarQuestions = questions.filter((q) => q.pillar === pillar);
  const answerMap = buildAnswerMap(answers);

  const scored: ScoredQuestion[] = pillarQuestions.map((q) => {
    const answer = answerMap.get(q.id);
    const rawScore = answer ? answer.score : 0;
    const weightedScore = rawScore * q.weight;
    const maxWeighted = 10 * q.weight;

    return {
      question_id: q.id,
      pillar,
      module: q.module,
      weight: q.weight,
      raw_score: rawScore,
      weighted_score: weightedScore,
      max_weighted: maxWeighted,
      pct_contribution: maxWeighted > 0 ? (weightedScore / maxWeighted) * 100 : 0,
    };
  });

  const totalWeighted = scored.reduce((sum, s) => sum + s.weighted_score, 0);
  const maxWeighted = scored.reduce((sum, s) => sum + s.max_weighted, 0);

  const score = maxWeighted > 0 ? Math.round((totalWeighted / maxWeighted) * 100) : 0;
  const level = classifyScore(score);

  // Sort to find weakest / strongest
  const sorted = [...scored].sort((a, b) => a.pct_contribution - b.pct_contribution);
  const answeredScored = scored.filter((s) => answerMap.has(s.question_id));

  return {
    score,
    level,
    total_weighted: totalWeighted,
    max_weighted: maxWeighted,
    questions: scored,
    weakest_question: answeredScored.length > 0 ? sorted[0] : null,
    strongest_question: answeredScored.length > 0 ? sorted[sorted.length - 1] : null,
  };
}

// ─── Calculate all three pillars ─────────────────────────────────────────────
export function scoreAllPillars(
  answers: DiagnosticAnswer[],
  questions: DiagnosticQuestion[]
) {
  const demanda   = scorePillar("demanda",   answers, questions);
  const conversao = scorePillar("conversao", answers, questions);
  const escala    = scorePillar("escala",    answers, questions);

  return { demanda, conversao, escala };
}

// ─── Calculate weighted overall score ────────────────────────────────────────
export function calculateOverall(
  demanda: number,
  conversao: number,
  escala: number
): number {
  return Math.round(
    demanda   * PILLAR_WEIGHTS.demanda +
    conversao * PILLAR_WEIGHTS.conversao +
    escala    * PILLAR_WEIGHTS.escala
  );
}

// ─── Gap analysis: gap between actual and 100 per pillar ────────────────────
export function calculatePillarGaps(
  demanda: number,
  conversao: number,
  escala: number
): Record<"demanda" | "conversao" | "escala", number> {
  return {
    demanda:   100 - demanda,
    conversao: 100 - conversao,
    escala:    100 - escala,
  };
}

// ─── Revenue opportunity estimate ────────────────────────────────────────────
// Rough estimate of how much more revenue is reachable with a better score.
// Formula: current_revenue * (100 / current_overall - 1) * 0.5
// The 0.5 factor makes it conservative.
export function estimateRevenueOpportunity(
  currentRevenue: number,
  overallScore: number
): number {
  if (overallScore <= 0 || currentRevenue <= 0) return 0;
  const multiplier = (100 / overallScore - 1) * 0.5;
  return Math.round(currentRevenue * multiplier);
}
