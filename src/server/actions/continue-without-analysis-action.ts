"use server";

import { redirect } from "next/navigation";

import {
  continueWithoutSiteAnalysis,
  type ContinueWithoutSiteAnalysisReason,
} from "@/server/continue-without-site-analysis";

const VALID_REASONS: ContinueWithoutSiteAnalysisReason[] = [
  "no_website",
  "failed",
  "user_declined",
];

function parseReason(value: FormDataEntryValue | null): ContinueWithoutSiteAnalysisReason {
  return typeof value === "string" &&
    (VALID_REASONS as string[]).includes(value)
    ? (value as ContinueWithoutSiteAnalysisReason)
    : "failed";
}

/**
 * Server Action que cobre três casos da Tela 3: sem site, falha na
 * análise, e "Continuar sem usar esses dados" (análise com sucesso, mas
 * a pessoa optou por não usá-la — só esse último caso envia
 * siteAnalysisId). Fina por cima de continueWithoutSiteAnalysis()
 * (src/server/continue-without-site-analysis.ts).
 */
export async function continueWithoutAnalysisAction(formData: FormData): Promise<void> {
  const diagnosticId = String(formData.get("diagnosticId") ?? "");
  const reason = parseReason(formData.get("reason"));
  const siteAnalysisId = formData.get("siteAnalysisId");

  if (!diagnosticId) {
    redirect("/diagnostico");
  }

  try {
    await continueWithoutSiteAnalysis({
      diagnosticId,
      reason,
      siteAnalysisId: typeof siteAnalysisId === "string" ? siteAnalysisId : null,
    });
  } catch {
    redirect(`/diagnostico/${diagnosticId}?analysisError=1`);
  }

  redirect(`/diagnostico/${diagnosticId}`);
}
