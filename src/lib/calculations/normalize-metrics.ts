/**
 * Seção 1: normalização — transforma diagnostic_answers (já em forma de
 * AnswerMap, ver src/lib/challenges/adaptive-engine.toAnswerMap) num
 * objeto tipado de cálculo (CommercialMetrics). Usa IDs de pergunta
 * (question_key), nunca os textos exibidos na UI.
 *
 * Pura: não acessa o banco, não conhece Supabase.
 */
import type { AnswerMap } from "@/lib/challenges/adaptive-engine";
import { RATE_BUCKET_MIDPOINTS, UNCERTAIN_ANSWER_VALUES } from "@/lib/calculations/config";
import { toSaneNumberOrNull } from "@/lib/calculations/rounding";
import type { CommercialMetrics, RateValue } from "@/lib/calculations/types";
import type { SelectedChallenge } from "@/types/tables";

function numberAnswer(answers: AnswerMap, key: string): number | null {
  return toSaneNumberOrNull(answers[key]);
}

/** D2_Q2: taxa lead->oportunidade autodeclarada por faixa. Retorna null quando ausente ou "não sei" (incerteza não vira taxa). */
function declaredRateFromBucket(answers: AnswerMap, key: string): RateValue | null {
  const raw = answers[key];
  if (typeof raw !== "string" || UNCERTAIN_ANSWER_VALUES.has(raw)) return null;

  const midpoint = RATE_BUCKET_MIDPOINTS[raw];
  if (midpoint === undefined) return null;

  return { value: midpoint, source: "declared_bucket" };
}

/**
 * Extrai CommercialMetrics das respostas de um diagnóstico. `selectedChallenge`
 * é obrigatório para saber qual conjunto de perguntas D*_Q* é legítimo
 * ler — nunca lê perguntas de um desafio diferente do que foi de fato
 * selecionado, mesmo que, por algum motivo, respostas órfãs de outro
 * desafio existam na tabela.
 */
export function extractCommercialMetrics(
  answers: AnswerMap,
  selectedChallenge: SelectedChallenge | null,
): CommercialMetrics {
  return {
    averageTicket: numberAnswer(answers, "U1"),
    salesCycleDays: numberAnswer(answers, "U2"),
    teamSize: numberAnswer(answers, "U3"),
    monthlyGoal: numberAnswer(answers, "U4"),
    // U5 alimenta dois campos do motor (currentMonthlySales e
    // salesPerMonth) — são o mesmo dado real (vendas fechadas/mês), só
    // usado em dois pontos diferentes do cálculo (engenharia reversa e
    // taxa proposta->venda); uma única pergunta responde aos dois, sem
    // perguntar a mesma coisa duas vezes.
    currentMonthlySales: numberAnswer(answers, "U5"),
    salesPerMonth: numberAnswer(answers, "U5"),
    leadsPerMonth: numberAnswer(answers, "U6"),
    opportunitiesPerMonth: numberAnswer(answers, "U7"),
    meetingsPerMonth: numberAnswer(answers, "U8"),
    proposalsPerMonth: numberAnswer(answers, "U9"),
    proposalStallDays: selectedChallenge === "D3" ? numberAnswer(answers, "D3_Q2") : null,
    // D2_Q2 (faixa autodeclarada) continua existindo como alternativa
    // quando a taxa não pode ser CALCULADA a partir de U6/U7 (ver
    // computeConversionRates em rates.ts, que prefere a taxa computada e
    // só cai para a declarada quando uma das duas contagens falta).
    declaredLeadToOpportunityRate:
      selectedChallenge === "D2" ? declaredRateFromBucket(answers, "D2_Q2") : null,
  };
}
