"use server";

import { generateCommercialPlanPdf } from "@/server/generate-commercial-plan-pdf";

// maxDuration NÃO pode ser exportado aqui — um arquivo "use server" só
// pode exportar funções async. Configurado na página que usa esta action
// — ver src/app/diagnostico/[diagnosticId]/page.tsx.

export type GetCommercialPlanPdfActionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Server Action chamada pelo botão "Baixar plano em PDF". Fina por cima
 * de generateCommercialPlanPdf() — só traduz o resultado para o que o
 * cliente precisa (a URL assinada para abrir/baixar).
 */
export async function getCommercialPlanPdfAction(
  diagnosticId: string,
): Promise<GetCommercialPlanPdfActionResult> {
  if (typeof diagnosticId !== "string" || diagnosticId.length === 0) {
    return { ok: false, reason: "diagnostic_not_found" };
  }

  const result = await generateCommercialPlanPdf(diagnosticId);

  if (result.status === "ready") {
    return { ok: true, url: result.url };
  }

  if (result.status === "skipped") {
    return { ok: false, reason: result.reason };
  }

  if (result.status === "generating") {
    return { ok: false, reason: "generating" };
  }

  return { ok: false, reason: result.reason };
}
