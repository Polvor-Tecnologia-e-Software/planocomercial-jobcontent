import "server-only";

import { analyticsEvents, diagnostics } from "@/lib/database";
import { CHALLENGES, getDeterministicQuestionRoute } from "@/lib/challenges/challenge-config";
import type { DiagnosticRow, SelectedChallenge } from "@/types/tables";

export type SelectChallengeInput = {
  diagnosticId: string;
  challenge: SelectedChallenge;
};

/**
 * Tela 4 (BRD): "Qual problema mais limita seu crescimento hoje?".
 * Deliberadamente NÃO chama nenhum serviço de IA — a escolha do desafio
 * seleciona uma rota de perguntas determinística (getDeterministicQuestionRoute,
 * src/lib/challenges/challenge-config.ts), calculada só a partir do
 * código do desafio.
 */
export async function selectChallenge(input: SelectChallengeInput): Promise<DiagnosticRow> {
  // Falha cedo e alto se alguém passar um código fora do catálogo (ex.:
  // FormData adulterado) — melhor um erro claro aqui do que gravar lixo.
  if (!(input.challenge in CHALLENGES)) {
    throw new Error(`Desafio desconhecido: "${input.challenge}"`);
  }

  const diagnostic = await diagnostics.updateDiagnostic(input.diagnosticId, {
    status: "challenge_selected",
    selected_challenge: input.challenge,
  });

  const route = getDeterministicQuestionRoute(input.challenge);

  await analyticsEvents.trackEvent({
    diagnostic_id: input.diagnosticId,
    event_name: "challenge_selected",
    event_data: {
      challenge: input.challenge,
      probable_dimension: CHALLENGES[input.challenge].probableDimension,
      question_route_length: route.length,
    },
  });

  return diagnostic;
}
