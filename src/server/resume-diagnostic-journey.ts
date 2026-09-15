import "server-only";

import {
  computeProgress,
  findNextQuestion,
  getApplicableRoute,
  toAnswerMap,
  type AdaptiveProgress,
} from "@/lib/challenges/adaptive-engine";
import { diagnosticAnswers, diagnostics } from "@/lib/database";
import { runDeterministicAnalysis } from "@/server/run-deterministic-analysis";
import type { DiagnosticAnswerRow, DiagnosticRow } from "@/types/tables";

export type DiagnosticJourneyState = {
  diagnostic: DiagnosticRow;
  answers: readonly DiagnosticAnswerRow[];
  progress: AdaptiveProgress;
  isComplete: boolean;
};

/**
 * Carrega o estado da jornada adaptativa para retomada: recupera as
 * respostas persistidas, reconstrói a rota aplicável (challenge-config +
 * adaptive-engine) e localiza onde a pessoa parou.
 *
 * Auto-cura o status: se todas as perguntas aplicáveis já estiverem
 * respondidas mas o diagnóstico ainda estiver marcado como
 * "challenge_selected"/"adaptive_in_progress" (ex.: o processo foi
 * interrompido entre gravar a última resposta e atualizar o status em
 * answerDiagnosticQuestion), corrige aqui — sem exigir uma nova resposta
 * para destravar a retomada. Nesse mesmo momento (a transição real para
 * "prediagnosis_ready"), dispara o motor determinístico de cálculos
 * (score, sinais, gargalo — nunca IA, ver src/lib/calculations) para que
 * o resultado já esteja persistido assim que a jornada de perguntas
 * termina. Só dispara nessa transição, não a cada retomada subsequente —
 * evita recalcular/regravar a cada refresh da página sem necessidade
 * (recalcular de novo é seguro/idempotente se algum dia for preciso, só
 * não é feito aqui automaticamente).
 *
 * Retorna null se o diagnóstico não existe ou ainda não tem desafio
 * selecionado (não deveria ser chamado nesse caso).
 */
export async function resumeDiagnosticJourney(
  diagnosticId: string,
): Promise<DiagnosticJourneyState | null> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic || !diagnostic.selected_challenge) return null;

  const answers = await diagnosticAnswers.listAnswers(diagnosticId);
  const answerMap = toAnswerMap(answers);
  const route = getApplicableRoute(diagnostic.selected_challenge, answerMap);
  const progress = computeProgress(route, answerMap);
  const isComplete = findNextQuestion(route, answerMap) === null;

  const needsHealing =
    isComplete &&
    diagnostic.status !== "prediagnosis_ready" &&
    (diagnostic.status === "challenge_selected" || diagnostic.status === "adaptive_in_progress");

  if (needsHealing) {
    const healed = await diagnostics.updateDiagnostic(diagnosticId, {
      status: "prediagnosis_ready",
    });
    await runDeterministicAnalysis(diagnosticId);
    return { diagnostic: healed, answers, progress, isComplete: true };
  }

  return { diagnostic, answers, progress, isComplete };
}
