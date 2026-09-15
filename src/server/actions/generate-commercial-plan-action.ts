"use server";

import { analyzeSeoOpportunities } from "@/server/analyze-seo-opportunities";
import { generateCommercialPlan } from "@/server/generate-commercial-plan";
import { sendRdStationConversion } from "@/server/send-rd-station-conversion";

// maxDuration NÃO pode ser exportado aqui — um arquivo "use server" só
// pode exportar funções async (erro de build real, encontrado ao testar).
// Nesta versão do Next.js, o timeout de Server Actions se configura na
// PÁGINA que as usa, não no arquivo da action — ver
// src/app/diagnostico/[diagnosticId]/page.tsx.

export type GeneratePlanActionResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Server Action chamada pelo botão "Gerar meu plano comercial" (ou
 * "Tentar novamente"). Fina por cima de generateCommercialPlan() — só
 * traduz o resultado para algo simples de o cliente decidir se mostra
 * erro, e sempre delega ao Server Component (via router.refresh()) a
 * decisão de qual estado renderizar a partir do banco, nunca confia no
 * resultado desta chamada como fonte de verdade duradoura.
 */
export async function generateCommercialPlanAction(diagnosticId: string): Promise<GeneratePlanActionResult> {
  if (typeof diagnosticId !== "string" || diagnosticId.length === 0) {
    return { ok: false, reason: "diagnostic_not_found" };
  }

  const result = await generateCommercialPlan(diagnosticId);

  if (result.status === "generated" || result.status === "cached") {
    // Best-effort e nunca bloqueante: as duas funções abaixo já tratam
    // toda falha internamente e nunca lançam, mas o try/catch aqui é a
    // última rede de segurança — a pessoa sempre vê o plano, mesmo se
    // algo inesperado quebrar numa integração externa. Em paralelo
    // (allSettled) porque são independentes uma da outra.
    const [rdStation, seo] = await Promise.allSettled([
      sendRdStationConversion(diagnosticId),
      analyzeSeoOpportunities(diagnosticId),
    ]);

    if (rdStation.status === "rejected") {
      console.error(
        "[generate-commercial-plan-action] Falha inesperada ao acionar RD Station:",
        rdStation.reason instanceof Error ? rdStation.reason.message : rdStation.reason,
      );
    }
    if (seo.status === "rejected") {
      console.error(
        "[generate-commercial-plan-action] Falha inesperada ao buscar oportunidades de SEO:",
        seo.reason instanceof Error ? seo.reason.message : seo.reason,
      );
    }

    return { ok: true };
  }

  if (result.status === "skipped") {
    return { ok: false, reason: result.reason };
  }

  return { ok: false, reason: result.reason };
}
