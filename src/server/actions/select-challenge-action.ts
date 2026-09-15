"use server";

import { redirect } from "next/navigation";

import { CHALLENGES } from "@/lib/challenges/challenge-config";
import { selectChallenge } from "@/server/select-challenge";
import type { SelectedChallenge } from "@/types/tables";

function isSelectedChallenge(value: unknown): value is SelectedChallenge {
  return typeof value === "string" && value in CHALLENGES;
}

/**
 * Server Action da Tela 4 — fina por cima de selectChallenge()
 * (src/server/select-challenge.ts): só extrai e valida o FormData,
 * delega a gravação e faz o redirect.
 */
export async function selectChallengeAction(formData: FormData): Promise<void> {
  const diagnosticId = String(formData.get("diagnosticId") ?? "");
  const challenge = formData.get("selectedChallenge");

  if (!diagnosticId || !isSelectedChallenge(challenge)) {
    redirect(`/diagnostico/${diagnosticId}?challengeError=1`);
  }

  try {
    await selectChallenge({ diagnosticId, challenge });
  } catch {
    redirect(`/diagnostico/${diagnosticId}?challengeError=1`);
  }

  redirect(`/diagnostico/${diagnosticId}`);
}
