import "server-only";

import { diagnostics, leads } from "@/lib/database";

/**
 * Versão do texto de consentimento mostrado junto do campo de telefone
 * (ver phone-gate.tsx) — amplia o consentimento da primeira captura
 * (só e-mail) para contato por telefone/WhatsApp. Suba este valor sempre
 * que o SENTIDO do texto mudar.
 */
const PHONE_CONSENT_VERSION = "phone-gate-implicit-v1";

export type SaveLeadPhoneResult = { status: "saved" } | { status: "skipped"; reason: "diagnostic_not_found" | "no_lead" };

/**
 * Grava o telefone pedido antes de liberar a tela do diagnóstico no lead
 * dono do diagnóstico, junto com a nova versão do consentimento. O
 * telefone é enviado ao RD Station como mobile_phone quando a conversão
 * dispara (depois da geração do plano, ver send-rd-station-conversion.ts).
 */
export async function saveLeadPhone(diagnosticId: string, phone: string): Promise<SaveLeadPhoneResult> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "skipped", reason: "diagnostic_not_found" };
  if (!diagnostic.lead_id) return { status: "skipped", reason: "no_lead" };

  await leads.updateLead(diagnostic.lead_id, {
    phone,
    consent_given: true,
    consent_version: PHONE_CONSENT_VERSION,
  });

  return { status: "saved" };
}
