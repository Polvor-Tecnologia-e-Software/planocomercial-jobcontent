"use server";

import { phoneSchema } from "@/lib/validation/phone";
import { saveLeadPhone } from "@/server/save-lead-phone";

export type SaveLeadPhoneActionResult = { ok: true } | { ok: false; fieldError?: string; formError?: string };

/**
 * Server Action da etapa de telefone (phone-gate.tsx). Só valida e grava —
 * a geração do plano é disparada pelo cliente logo depois, reaproveitando
 * generateCommercialPlanAction, para manter cada action com uma só
 * responsabilidade.
 */
export async function saveLeadPhoneAction(diagnosticId: string, phone: string): Promise<SaveLeadPhoneActionResult> {
  const parsed = phoneSchema.safeParse(typeof phone === "string" ? phone : "");
  if (!parsed.success) {
    return { ok: false, fieldError: parsed.error.issues[0]?.message ?? "Telefone inválido." };
  }

  try {
    const result = await saveLeadPhone(diagnosticId, parsed.data);
    if (result.status !== "saved") {
      return { ok: false, formError: "Não encontramos este diagnóstico." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[save-lead-phone-action] Falha ao salvar telefone:",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, formError: "Não conseguimos salvar seu telefone agora. Tente novamente em instantes." };
  }
}
