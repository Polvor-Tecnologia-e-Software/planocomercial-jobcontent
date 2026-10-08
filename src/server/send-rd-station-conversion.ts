import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { dimensionLabel } from "@/components/result/dimension-labels";
import { CHALLENGES } from "@/lib/challenges/challenge-config";
import { RD_CONVERSION_IDENTIFIERS, type RdConversionIdentifier } from "@/lib/rd-station/config";
import { sendConversion } from "@/lib/rd-station/client";
import {
  buildRdStationConversionPayload,
  type RdStationConversionPayload,
  type RdStationLeadInput,
} from "@/lib/rd-station/payload";
import { companies, diagnostics, leads, rdIntegrations } from "@/lib/database";
import { getCommercialPlanResult } from "@/server/get-commercial-plan-result";
import type { LeadRow } from "@/types/tables";

/** Tentativas totais (1ª + retries) antes de desistir e marcar falha permanente. */
const MAX_ATTEMPTS = 3;

export type SendRdStationConversionResult =
  | {
      status: "skipped";
      reason: "not_configured" | "diagnostic_not_found" | "plan_not_ready" | "missing_email" | "consent_missing";
    }
  | { status: "already_sent" }
  | { status: "sent" }
  | { status: "retrying" }
  | { status: "failed"; reason: "validation_error" | "auth_error" | "too_many_attempts" };

/**
 * Link público da tela do diagnóstico desta pessoa, enviado em
 * cf_link_plano_comercial (pedido explícito). Usa APP_URL — em produção,
 * https://quiz.jobcontent.com.br — e nunca expira (diferente do link
 * assinado do PDF que ia neste campo antes, válido só por 7 dias).
 */
function buildDiagnosticLink(appUrl: string, diagnosticId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/diagnostico/${diagnosticId}`;
}

/** Dados do lead usados por QUALQUER conversão, incluindo a origem (cookie da RD ou UTMs). */
function leadInputOf(lead: LeadRow & { email: string }): RdStationLeadInput {
  return {
    email: lead.email,
    name: lead.name,
    // leads só tem uma coluna de telefone — mapeada para mobile_phone
    // (mais útil para follow-up comercial via WhatsApp).
    personalPhone: null,
    mobilePhone: lead.phone,
    jobTitle: lead.job_title,
    utmSource: lead.utm_source,
    utmMedium: lead.utm_medium,
    utmCampaign: lead.utm_campaign,
    utmContent: lead.utm_content,
    utmTerm: lead.utm_term,
    rdTrafficSource: lead.rd_traffic_source,
    rdClientTrackingId: lead.rd_client_tracking_id,
  };
}

/**
 * Parte comum às duas conversões: idempotência (uma linha por
 * diagnostic_id + event_name em rd_integrations), limite de tentativas,
 * envio e registro do resultado. Nunca lança por falha da RD — só
 * registra e devolve um status.
 */
async function deliverConversion(params: {
  diagnosticId: string;
  leadId: string;
  eventName: RdConversionIdentifier;
  buildPayload: () => Promise<RdStationConversionPayload>;
}): Promise<SendRdStationConversionResult> {
  const { diagnosticId, leadId, eventName } = params;
  const existing = await rdIntegrations.findIntegrationByEvent(diagnosticId, eventName);

  if (existing?.status === "sent") {
    return { status: "already_sent" };
  }
  if (existing?.status === "failed") {
    return { status: "failed", reason: "validation_error" };
  }
  if (existing && existing.attempts >= MAX_ATTEMPTS) {
    await rdIntegrations.markIntegrationPermanentlyFailed(existing.id, "too_many_attempts");
    return { status: "failed", reason: "too_many_attempts" };
  }

  const payload = await params.buildPayload();

  const { row: integrationRow } =
    existing !== null
      ? { row: existing }
      : await rdIntegrations.createIntegrationIfAbsent({
          diagnostic_id: diagnosticId,
          lead_id: leadId,
          event_name: eventName,
          payload,
          status: "pending",
          attempts: 0,
        });

  const outcome = await sendConversion(payload);

  // Log só com metadados — nunca a API Key, nunca o payload completo
  // (tem e-mail/telefone), nunca o corpo da resposta do RD Station.
  console.log("[send-rd-station-conversion]", {
    diagnostic_id: diagnosticId,
    conversion_identifier: eventName,
    status: outcome.kind,
    attempts: integrationRow.attempts + 1,
    http_status: "httpStatus" in outcome ? outcome.httpStatus : null,
    latency_ms: outcome.latencyMs,
    created_at: integrationRow.created_at,
    sent_at: new Date().toISOString(),
  });

  if (outcome.kind === "success") {
    await rdIntegrations.markIntegrationSent(integrationRow.id);
    return { status: "sent" };
  }

  if (outcome.kind === "validation_error" || outcome.kind === "auth_error") {
    await rdIntegrations.markIntegrationPermanentlyFailed(integrationRow.id, outcome.kind);
    return { status: "failed", reason: outcome.kind === "auth_error" ? "auth_error" : "validation_error" };
  }

  // timeout / network_error / server_error / rate_limited: temporário —
  // elegível a nova tentativa numa próxima chamada desta função.
  await rdIntegrations.markIntegrationFailed(integrationRow.id, outcome.kind);
  return { status: "retrying" };
}

/**
 * Conversão "plano-comercial-90-dias-captura": envio do formulário inicial
 * (nome, e-mail, empresa, site e origem). Chamada logo depois de criar o
 * diagnóstico (ver src/server/actions/start-diagnostic-action.ts), fora
 * do caminho da resposta — nunca atrasa nem bloqueia a jornada.
 *
 * LGPD: o consentimento (implícito) é gravado no próprio envio do
 * formulário — ver LGPD_CONSENT_VERSION em src/server/start-diagnostic.ts.
 */
export async function sendRdStationCaptureConversion(diagnosticId: string): Promise<SendRdStationConversionResult> {
  const env = parseServerEnv();
  if (!env.RD_STATION_API_KEY) return { status: "skipped", reason: "not_configured" };

  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic?.lead_id) return { status: "skipped", reason: "diagnostic_not_found" };

  const [company, lead] = await Promise.all([
    companies.getCompanyById(diagnostic.company_id),
    leads.getLeadById(diagnostic.lead_id),
  ]);
  if (!company || !lead) return { status: "skipped", reason: "diagnostic_not_found" };
  if (!lead.email) return { status: "skipped", reason: "missing_email" };
  if (!lead.consent_given) return { status: "skipped", reason: "consent_missing" };

  const email = lead.email;
  return deliverConversion({
    diagnosticId,
    leadId: lead.id,
    eventName: RD_CONVERSION_IDENTIFIERS.capture,
    buildPayload: async () =>
      buildRdStationConversionPayload({
        conversionIdentifier: RD_CONVERSION_IDENTIFIERS.capture,
        lead: leadInputOf({ ...lead, email }),
        company: { companyName: company.company_name, website: company.website, segment: company.segment },
        diagnostic: { diagnosticId, challengeLabel: null, primaryBottleneckLabel: null, confidenceLevel: null },
        planLink: buildDiagnosticLink(env.APP_URL, diagnosticId),
      }),
  });
}

/**
 * Conversão "plano-comercial-90-dias-realizado": enviada quando o plano
 * comercial de 90 dias já foi gerado (mesmo sinal usado pela tela de
 * resultado — getCommercialPlanResult, nunca chama IA aqui), já com
 * telefone, desafio, gargalo e link do PDF.
 *
 * Nunca lança e nunca bloqueia a jornada — quem chama (ver
 * src/server/actions/generate-commercial-plan-action.ts) nunca deixa isso
 * impedir a pessoa de ver o plano.
 */
export async function sendRdStationCompletedConversion(
  diagnosticId: string,
): Promise<SendRdStationConversionResult> {
  const env = parseServerEnv();
  if (!env.RD_STATION_API_KEY) {
    return { status: "skipped", reason: "not_configured" };
  }

  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "skipped", reason: "diagnostic_not_found" };

  const result = await getCommercialPlanResult(diagnosticId);
  if (result.status !== "completed") {
    return { status: "skipped", reason: "plan_not_ready" };
  }

  // O plano existir é, por definição, o diagnóstico ter chegado ao fim —
  // registra isso independente do resto desta função ter sucesso ou não.
  if (diagnostic.status !== "completed") {
    await diagnostics.completeDiagnostic(diagnosticId);
  }

  if (!diagnostic.lead_id) {
    return { status: "skipped", reason: "diagnostic_not_found" };
  }

  const [company, lead] = await Promise.all([
    companies.getCompanyById(diagnostic.company_id),
    leads.getLeadById(diagnostic.lead_id),
  ]);

  if (!company || !lead) {
    return { status: "skipped", reason: "diagnostic_not_found" };
  }
  if (!lead.email) {
    return { status: "skipped", reason: "missing_email" };
  }
  if (!lead.consent_given) {
    return { status: "skipped", reason: "consent_missing" };
  }

  const email = lead.email;
  return deliverConversion({
    diagnosticId,
    leadId: lead.id,
    eventName: RD_CONVERSION_IDENTIFIERS.completed,
    buildPayload: async () =>
      buildRdStationConversionPayload({
        conversionIdentifier: RD_CONVERSION_IDENTIFIERS.completed,
        lead: leadInputOf({ ...lead, email }),
        company: { companyName: company.company_name, website: company.website, segment: company.segment },
        diagnostic: {
          diagnosticId,
          challengeLabel: diagnostic.selected_challenge ? CHALLENGES[diagnostic.selected_challenge].title : null,
          primaryBottleneckLabel: diagnostic.primary_bottleneck ? dimensionLabel(diagnostic.primary_bottleneck) : null,
          confidenceLevel: diagnostic.confidence_level,
        },
        planLink: buildDiagnosticLink(env.APP_URL, diagnosticId),
      }),
  });
}
