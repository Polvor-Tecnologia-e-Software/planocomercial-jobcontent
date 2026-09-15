import "server-only";

import { analyticsEvents, diagnostics, siteAnalyses } from "@/lib/database";
import type { DiagnosticRow } from "@/types/tables";

export type ContinueWithoutSiteAnalysisReason = "no_website" | "failed" | "user_declined";

export type ContinueWithoutSiteAnalysisInput = {
  diagnosticId: string;
  reason: ContinueWithoutSiteAnalysisReason;
  /**
   * Presente apenas no caso "user_declined" (Tela 3: "Continuar sem usar
   * esses dados") — a análise existe e teve sucesso, mas a pessoa optou
   * por não usá-la. Marca a análise como "skipped", diferente de
   * "rejected" (análise incorreta).
   */
  siteAnalysisId?: string | null;
};

/**
 * Cobre três casos do BRD: "continuar sem análise" (empresa não tem
 * site), "continuar quando a análise falhar" (falha nunca bloqueia a
 * conclusão do diagnóstico, seção 5.3) e "continuar sem usar esses
 * dados" (a análise pode até estar certa, mas a pessoa optou por não
 * usá-la). Em todos os casos a jornada segue sem dados inferidos do
 * site.
 */
export async function continueWithoutSiteAnalysis(
  input: ContinueWithoutSiteAnalysisInput,
): Promise<DiagnosticRow> {
  if (input.reason === "user_declined" && input.siteAnalysisId) {
    await siteAnalyses.updateSiteAnalysis(input.siteAnalysisId, { status: "skipped" });
  }

  const diagnostic = await diagnostics.updateDiagnostic(input.diagnosticId, {
    status: "company_confirmed",
  });

  await analyticsEvents.trackEvent({
    diagnostic_id: input.diagnosticId,
    event_name: "company_analysis_skipped",
    event_data: { reason: input.reason },
  });

  return diagnostic;
}
