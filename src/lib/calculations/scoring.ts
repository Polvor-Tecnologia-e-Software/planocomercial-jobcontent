/**
 * Seção 7: score por dimensão (demanda, conversão, processos, gestão,
 * escala, posicionamento digital).
 *
 * Regras aplicadas:
 * - só perguntas de SELEÇÃO ÚNICA pontuam (ver SELECT_QUESTION_SCORE_TABLE
 *   em config.ts) — perguntas numéricas abertas e de texto livre nunca
 *   pontuam, para não aplicar um benchmark de mercado disfarçado de score;
 * - "perguntas fora da rota são neutras": só perguntas que estão
 *   atualmente na rota aplicável do desafio escolhido (adaptive-engine)
 *   contam — uma pergunta nunca respondida não pesa contra a dimensão;
 * - dimensão sem nenhuma resposta aplicável = score neutro (50) e peso 0
 *   (weight 0 sinaliza "sem dados", não "problema confirmado" — quem
 *   consome o score deve tratar weight=0 como ausência de evidência,
 *   nunca como score real);
 * - resposta de incerteza ("não sei"/"não sabemos") conta como neutra
 *   (50) uma única vez — nunca penalizada duas vezes;
 * - score entre 0 e 100, evidências guardadas para cada contribuição
 *   (rastreável, reproduzível).
 *
 * Hoje, como cada diagnóstico só responde as perguntas de UM desafio
 * (seleção única em selectChallenge), só a dimensão desse desafio tem
 * evidência real — as outras 5 ficam neutras/peso 0 até o catálogo
 * eventualmente cobrir mais de um desafio por diagnóstico.
 */
import { getApplicableRoute, isQuestionAnswered, type AnswerMap } from "@/lib/challenges/adaptive-engine";
import { CHALLENGES } from "@/lib/challenges/challenge-config";
import {
  ALL_DIMENSIONS,
  DIMENSION_WEIGHTS,
  NEUTRAL_SCORE,
  SELECT_QUESTION_SCORE_TABLE,
  UNCERTAIN_ANSWER_VALUES,
} from "@/lib/calculations/config";
import { roundToInt } from "@/lib/calculations/rounding";
import type { DimensionScoreResult, ScoreResult } from "@/lib/calculations/types";
import type { Dimension, SelectedChallenge } from "@/types/tables";

const CHALLENGE_CODE_PATTERN = /^(D[1-6])_/;

function dimensionForQuestionKey(key: string): Dimension | null {
  const match = CHALLENGE_CODE_PATTERN.exec(key);
  if (!match) return null;
  const code = match[1] as SelectedChallenge;
  return CHALLENGES[code]?.probableDimension ?? null;
}

function emptyDimensionScores(): Record<Dimension, DimensionScoreResult> {
  const result = {} as Record<Dimension, DimensionScoreResult>;
  for (const dimension of ALL_DIMENSIONS) {
    result[dimension] = { dimension, score: NEUTRAL_SCORE, weight: 0, evidence: [] };
  }
  return result;
}

export function computeDimensionScores(
  answers: AnswerMap,
  selectedChallenge: SelectedChallenge | null,
): ScoreResult {
  const dimensions = emptyDimensionScores();
  const route = selectedChallenge ? getApplicableRoute(selectedChallenge, answers) : [];

  for (const item of route) {
    const key = item.question.key;
    const scoreTable = SELECT_QUESTION_SCORE_TABLE[key];
    if (!scoreTable) continue; // pergunta numérica/texto/universal -> não pontuada

    const rawValue = answers[key];
    if (!isQuestionAnswered(rawValue) || typeof rawValue !== "string") continue;

    const dimension = dimensionForQuestionKey(key);
    if (!dimension) continue;

    const points = UNCERTAIN_ANSWER_VALUES.has(rawValue) ? NEUTRAL_SCORE : scoreTable[rawValue];
    if (points === undefined) continue; // valor fora da tabela — não deveria acontecer se a validação de resposta rodou antes

    dimensions[dimension].evidence.push({ questionKey: key, answerValue: rawValue, points });
  }

  for (const dimension of ALL_DIMENSIONS) {
    const entry = dimensions[dimension];
    if (entry.evidence.length === 0) {
      entry.score = NEUTRAL_SCORE;
      entry.weight = 0;
      continue;
    }
    const sum = entry.evidence.reduce((total, item) => total + item.points, 0);
    entry.score = roundToInt(sum / entry.evidence.length);
    entry.weight = entry.evidence.length;
  }

  const dimensionsWithData = ALL_DIMENSIONS.filter((dimension) => dimensions[dimension].weight > 0);
  let overallScore: number | null = null;
  if (dimensionsWithData.length > 0) {
    const weightedSum = dimensionsWithData.reduce(
      (total, dimension) => total + dimensions[dimension].score * DIMENSION_WEIGHTS[dimension],
      0,
    );
    const totalWeight = dimensionsWithData.reduce(
      (total, dimension) => total + DIMENSION_WEIGHTS[dimension],
      0,
    );
    overallScore = roundToInt(weightedSum / totalWeight);
  }

  return { dimensions, overallScore };
}
