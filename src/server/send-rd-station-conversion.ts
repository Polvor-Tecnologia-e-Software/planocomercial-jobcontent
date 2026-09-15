import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { dimensionLabel } from "@/components/result/dimension-labels";
import { CHALLENGES } from "@/lib/challenges/challenge-config";
import { RD_CONVERSION_IDENTIFIER } from "@/lib/rd-station/config";
import { sendConversion } from "@/lib/rd-station/client";
import { buildRdStationConversionPayload } from "@/lib/rd-station/payload";
import { companies, diagnostics, leads, pdfReports, rdIntegrations } from "@/lib/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCommercialPlanResult } from "@/server/get-commercial-plan-result";

const PDF_BUCKET = "pdf-reports";
/**
 * TTL bem maior que o do botão de download avulso (1h, ver
 * generate-commercial-plan-pdf.tsx): este link vai para o CRM, para uso do
 * time comercial ao longo de vários dias — não é um clique único.
 */
const PDF_LINK_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias
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

async function findAvailablePdfLink(diagnosticId: string): Promise<string | null> {
  const latest = await pdfReports.getLatestPdfReport(diagnosticId);
  if (!latest || latest.status !== "available") return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(latest.storage_path, PDF_LINK_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Envia a conversão "plano-comercial-90-dias" ao RD Station Marketing
 * (endpoint de Conversão, API Key) quando o diagnóstico de um lead atinge
 * o ponto real de conclusão: o plano comercial de 90 dias já foi gerado
 * (mesmo sinal usado pela tela de resultado — getCommercialPlanResult,
 * nunca chama IA aqui).
 *
 * Nunca lança e nunca bloqueia a jornada: qualquer falha (RD Station fora
 * do ar, API Key ausente/errada, payload rejeitado) só é registrada em
 * rd_integrations e retornada como um status — quem chama (ver
 * src/server/actions/generate-commercial-plan-action.ts) nunca deixa isso
 * impedir a pessoa de ver o plano.
 *
 * Idempotente: uma linha por (diagnostic_id, event_name) — chamadas
 * repetidas (novo clique, retomada, corrida) reaproveitam a linha
 * existente em vez de enviar duas conversões (ver
 * src/lib/database/rd-integrations.ts, createIntegrationIfAbsent).
 *
 * LGPD: só envia depois de leads.consent_given = true. Esse consentimento
 * é implícito (sem checkbox separado) e registrado no próprio envio da
 * Tela 2 — ver LGPD_CONSENT_VERSION em src/server/start-diagnostic.ts.
 */
export async function sendRdStationConversion(diagnosticId: string): Promise<SendRdStationConversionResult> {
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
  // registra isso independente do resto desta função ter sucesso ou não
  // (diagnostics.completeDiagnostic() nunca era chamado por nada até aqui).
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

  const existing = await rdIntegrations.findIntegrationByEvent(diagnosticId, RD_CONVERSION_IDENTIFIER);

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

  const pdfLink = await findAvailablePdfLink(diagnosticId);

  const payload = buildRdStationConversionPayload({
    lead: {
      email: lead.email,
      name: lead.name,
      // leads só tem uma coluna de telefone hoje — mapeada para
      // mobile_phone (mais útil para follow-up comercial via WhatsApp do
      // que personal_phone). Ver riscos remanescentes no relatório final.
      personalPhone: null,
      mobilePhone: lead.phone,
      jobTitle: lead.job_title,
      utmSource: lead.utm_source,
      utmMedium: lead.utm_medium,
      utmCampaign: lead.utm_campaign,
      utmContent: lead.utm_content,
      utmTerm: lead.utm_term,
    },
    company: {
      companyName: company.company_name,
      website: company.website,
      segment: company.segment,
    },
    diagnostic: {
      diagnosticId,
      challengeLabel: diagnostic.selected_challenge ? CHALLENGES[diagnostic.selected_challenge].title : null,
      primaryBottleneckLabel: diagnostic.primary_bottleneck ? dimensionLabel(diagnostic.primary_bottleneck) : null,
      confidenceLevel: diagnostic.confidence_level,
    },
    pdf: pdfLink ? { url: pdfLink } : null,
  });

  const { row: integrationRow } =
    existing !== null
      ? { row: existing }
      : await rdIntegrations.createIntegrationIfAbsent({
          diagnostic_id: diagnosticId,
          lead_id: lead.id,
          event_name: RD_CONVERSION_IDENTIFIER,
          payload,
          status: "pending",
          attempts: 0,
        });

  const outcome = await sendConversion(payload);

  // Log só com metadados — nunca a API Key, nunca o payload completo
  // (tem e-mail/telefone), nunca o corpo da resposta do RD Station.
  console.log("[send-rd-station-conversion]", {
    diagnostic_id: diagnosticId,
    conversion_identifier: RD_CONVERSION_IDENTIFIER,
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
  // elegível a nova tentativa numa próxima chamada desta função (não há
  // fila de retry em background nesta etapa, só o novo attempt na
  // próxima vez que o gatilho ocorrer).
  await rdIntegrations.markIntegrationFailed(integrationRow.id, outcome.kind);
  return { status: "retrying" };
}
