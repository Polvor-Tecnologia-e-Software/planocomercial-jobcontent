import "server-only";

import {
  findQuestionInChallenge,
  getApplicableRoute,
  isQuestionAnswered,
  toAnswerMap,
  validateAnswerValue,
} from "@/lib/challenges/adaptive-engine";
import { analyticsEvents, diagnosticAnswers, diagnostics } from "@/lib/database";
import { runDeterministicAnalysis } from "@/server/run-deterministic-analysis";
import type { DiagnosticRow } from "@/types/tables";

export type AnswerDiagnosticQuestionInput = {
  diagnosticId: string;
  questionKey: string;
  /** Não confiável — vem do cliente. Sempre revalidado contra o catálogo da pergunta antes de gravar. */
  rawValue: unknown;
};

export type AnswerDiagnosticQuestionResult =
  | {
      status: "saved";
      diagnostic: DiagnosticRow;
      isComplete: boolean;
      /** Valor normalizado que foi de fato persistido (ex.: "42" vira o número 42) — use este, não o rawValue enviado. */
      value: string | number;
    }
  | {
      status: "error";
      reason:
        | "diagnostic_not_found"
        | "challenge_not_selected"
        | "unknown_question"
        | "not_applicable"
        | "invalid_value";
    };

/**
 * Grava (ou atualiza) a resposta de uma pergunta da jornada adaptativa.
 *
 * Nunca confia no cliente sobre qual pergunta "deveria" estar disponível
 * agora: recalcula a rota aplicável a partir das respostas já persistidas
 * no banco antes de aceitar a resposta nova, e rejeita:
 * - question_key que não existe no catálogo do desafio escolhido;
 * - question_key que existe, mas cuja displayRule não está satisfeita
 *   pelas respostas atuais (impede pular etapas manipulando o cliente, e
 *   impede regravar uma pergunta que ficou "fora da rota" depois que uma
 *   resposta anterior mudou);
 * - valores fora do que o tipo/opções da pergunta permitem.
 *
 * Ao salvar a última pergunta aplicável pendente, avança o status do
 * diagnóstico para "prediagnosis_ready" e dispara o motor determinístico
 * (score, gargalo, qualidade de dados — nunca IA, ver
 * src/server/run-deterministic-analysis.ts) imediatamente, no mesmo
 * request. Isso precisa acontecer AQUI, não só na "cura" de
 * resumeDiagnosticJourney: como esta função já deixa o status em
 * "prediagnosis_ready", uma página carregada depois nunca mais entra na
 * condição que dispara aquela cura — sem o disparo direto aqui, o
 * diagnóstico nunca teria gargalo/score calculado no fluxo normal (bug
 * real, encontrado testando a jornada completa pela primeira vez com IA
 * de verdade).
 */
export async function answerDiagnosticQuestion(
  input: AnswerDiagnosticQuestionInput,
): Promise<AnswerDiagnosticQuestionResult> {
  const diagnostic = await diagnostics.getDiagnosticById(input.diagnosticId);
  if (!diagnostic) return { status: "error", reason: "diagnostic_not_found" };
  if (!diagnostic.selected_challenge) return { status: "error", reason: "challenge_not_selected" };

  const found = findQuestionInChallenge(diagnostic.selected_challenge, input.questionKey);
  if (!found) return { status: "error", reason: "unknown_question" };

  const existingAnswers = await diagnosticAnswers.listAnswers(input.diagnosticId);
  const answersBefore = toAnswerMap(existingAnswers);

  const routeBefore = getApplicableRoute(diagnostic.selected_challenge, answersBefore);
  const isCurrentlyApplicable = routeBefore.some((item) => item.key === input.questionKey);
  if (!isCurrentlyApplicable) return { status: "error", reason: "not_applicable" };

  const validated = validateAnswerValue(found.question, input.rawValue);
  if (!validated.valid) return { status: "error", reason: "invalid_value" };

  await diagnosticAnswers.upsertAnswer({
    diagnosticId: input.diagnosticId,
    questionKey: input.questionKey,
    answerValue: validated.value,
    answerSource: "user",
    confirmed: true,
  });

  const answersAfter: typeof answersBefore = { ...answersBefore, [input.questionKey]: validated.value };
  const routeAfter = getApplicableRoute(diagnostic.selected_challenge, answersAfter);
  const isComplete = routeAfter.every((item) => isQuestionAnswered(answersAfter[item.key]));

  const nextStatus: DiagnosticRow["status"] = isComplete
    ? "prediagnosis_ready"
    : diagnostic.status === "challenge_selected"
      ? "adaptive_in_progress"
      : diagnostic.status;

  const updatedDiagnostic = await diagnostics.updateDiagnostic(input.diagnosticId, {
    status: nextStatus,
    current_step: input.questionKey,
  });

  if (isComplete) {
    await runDeterministicAnalysis(input.diagnosticId);
  }

  await analyticsEvents.trackEvent({
    diagnostic_id: input.diagnosticId,
    event_name: "diagnostic_answer_saved",
    event_data: { question_key: input.questionKey, status: nextStatus },
  });

  return { status: "saved", diagnostic: updatedDiagnostic, isComplete, value: validated.value };
}
