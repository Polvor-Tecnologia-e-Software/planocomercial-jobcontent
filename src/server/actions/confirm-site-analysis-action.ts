"use server";

import { redirect } from "next/navigation";

import { parseCompanyProfileFieldsFromForm } from "@/lib/validation/site-analysis-confirmation";
import { confirmSiteAnalysis } from "@/server/confirm-site-analysis";

/**
 * Server Action da Tela 3 (confirmação da análise de site) — cobre tanto
 * "Sim, continuar" quanto "Quero ajustar e confirmar" (o formulário é o
 * mesmo; editar só muda os valores enviados antes de confirmar).
 *
 * Fica deliberadamente "fina": só extrai o FormData e delega para
 * confirmSiteAnalysis() (src/server/confirm-site-analysis.ts), que não
 * conhece FormData nem faz redirect — o que a torna simples de testar
 * isoladamente.
 */
export async function confirmSiteAnalysisAction(formData: FormData): Promise<void> {
  const diagnosticId = String(formData.get("diagnosticId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const siteAnalysisId = formData.get("siteAnalysisId");

  if (!diagnosticId || !companyId) {
    redirect(`/diagnostico/${diagnosticId}?analysisError=1`);
  }

  try {
    await confirmSiteAnalysis({
      diagnosticId,
      companyId,
      siteAnalysisId: typeof siteAnalysisId === "string" ? siteAnalysisId : null,
      edited: formData.get("edited") === "true",
      fields: parseCompanyProfileFieldsFromForm(formData),
    });
  } catch {
    redirect(`/diagnostico/${diagnosticId}?analysisError=1`);
  }

  // redirect() lança um sinal especial do Next.js — precisa ficar fora
  // do try/catch acima, senão o catch o interpretaria como um erro real.
  redirect(`/diagnostico/${diagnosticId}`);
}
