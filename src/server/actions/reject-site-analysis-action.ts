"use server";

import { redirect } from "next/navigation";

import { rejectSiteAnalysis } from "@/server/reject-site-analysis";

/**
 * Server Action da Tela 3: "Não está correto" — a análise automática não
 * representa a empresa. Fina por cima de rejectSiteAnalysis()
 * (src/server/reject-site-analysis.ts).
 */
export async function rejectSiteAnalysisAction(formData: FormData): Promise<void> {
  const diagnosticId = String(formData.get("diagnosticId") ?? "");
  const siteAnalysisId = formData.get("siteAnalysisId");

  if (!diagnosticId) {
    redirect("/diagnostico");
  }

  try {
    await rejectSiteAnalysis({
      diagnosticId,
      siteAnalysisId: typeof siteAnalysisId === "string" ? siteAnalysisId : null,
    });
  } catch {
    redirect(`/diagnostico/${diagnosticId}?analysisError=1`);
  }

  redirect(`/diagnostico/${diagnosticId}`);
}
