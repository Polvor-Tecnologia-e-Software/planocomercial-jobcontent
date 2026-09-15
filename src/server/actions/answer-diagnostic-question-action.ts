"use server";

import {
  answerDiagnosticQuestion,
  type AnswerDiagnosticQuestionResult,
} from "@/server/answer-diagnostic-question";

/**
 * Server Action da jornada adaptativa (Telas 5+ do BRD).
 *
 * Diferente das outras Server Actions deste projeto (que recebem FormData
 * e sempre terminam em redirect()): esta é chamada diretamente pelo
 * componente cliente a cada pergunta respondida, dentro da mesma página —
 * um redirect/reload aqui violaria o requisito de não recarregar a
 * página a cada resposta. Next.js permite Server Actions como funções
 * tipadas comuns, não só via <form action>; o retorno tipado é o que
 * permite ao cliente decidir localmente para onde ir em seguida.
 */
export async function answerDiagnosticQuestionAction(
  diagnosticId: string,
  questionKey: string,
  rawValue: unknown,
): Promise<AnswerDiagnosticQuestionResult> {
  if (typeof diagnosticId !== "string" || diagnosticId.length === 0) {
    return { status: "error", reason: "diagnostic_not_found" };
  }
  if (typeof questionKey !== "string" || questionKey.length === 0) {
    return { status: "error", reason: "unknown_question" };
  }

  return answerDiagnosticQuestion({ diagnosticId, questionKey, rawValue });
}
