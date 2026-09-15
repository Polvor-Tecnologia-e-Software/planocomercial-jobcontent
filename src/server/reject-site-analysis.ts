import "server-only";

import { analyticsEvents, diagnostics, siteAnalyses } from "@/lib/database";
import type { DiagnosticRow } from "@/types/tables";

export type RejectSiteAnalysisInput = {
  diagnosticId: string;
  siteAnalysisId?: string | null;
};

/**
 * A pessoa disse que a análise automática NÃO representa a empresa dela
 * (Tela 3: "Não está correto"). A jornada segue sem os dados inferidos —
 * nada é gravado em "companies". Diferente de "continuar sem usar esses
 * dados" (src/server/continue-without-site-analysis.ts): aqui a pessoa
 * está sinalizando que a análise saiu errada, um sinal útil para
 * melhorar o prompt/IA no futuro.
 */
export async function rejectSiteAnalysis(
  input: RejectSiteAnalysisInput,
): Promise<DiagnosticRow> {
  if (input.siteAnalysisId) {
    await siteAnalyses.updateSiteAnalysis(input.siteAnalysisId, { status: "rejected" });
  }

  const diagnostic = await diagnostics.updateDiagnostic(input.diagnosticId, {
    status: "company_confirmed",
  });

  await analyticsEvents.trackEvent({
    diagnostic_id: input.diagnosticId,
    event_name: "company_analysis_rejected",
  });

  return diagnostic;
}
