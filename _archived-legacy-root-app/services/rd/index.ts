/**
 * /services/rd/index.ts
 *
 * RD Station CRM integration.
 * - Upserts contact via PATCH /platform/contacts
 * - Sets all custom fields including cf_link_plano_comercial
 * - Registers LGPD legal bases
 * - Logs every attempt to Supabase rd_integrations table
 * - Never throws — always returns RDResult
 * - Gracefully mocks when token is not configured
 */

import type { ScoreEngineOutput } from "@/services/score-engine";

// ─── Input ────────────────────────────────────────────────────────────────────
export interface RDIntegrationInput {
  // Lead identity
  email:        string;
  phone?:       string;
  job_title?:   string;
  website?:     string;

  // Company
  company_name: string;

  // Scores
  engine:       ScoreEngineOutput;

  // PDF
  pdf_url?:     string;

  // LGPD
  lgpd_consent:    boolean;
  lgpd_consent_at: string; // ISO string
  lgpd_version:    string;

  // Supabase IDs for logging
  lead_id?:       string;
  diagnostic_id?: string;
}

// ─── Output ───────────────────────────────────────────────────────────────────
export interface RDResult {
  success:    boolean;
  rd_uuid?:   string;
  mocked:     boolean;
  error?:     string;
  log_id?:    string;  // Supabase rd_integrations row id
}

// ─── RD Station API base ──────────────────────────────────────────────────────
const RD_API = "https://api.rd.services/platform/contacts";

// ─── Guard ────────────────────────────────────────────────────────────────────
function isRDConfigured(): boolean {
  const token = process.env.RD_STATION_TOKEN ?? "";
  return token.length > 10 && !token.includes("placeholder");
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return url.startsWith("https://") && !url.includes("placeholder") && key.length > 20;
}

// ─── Supabase log helpers ─────────────────────────────────────────────────────
interface LogPayload {
  lead_id?:       string;
  diagnostic_id?: string;
  payload:        Record<string, unknown>;
  status:         "pending" | "success" | "error";
  error_message?: string;
  rd_contact_id?: string;
}

async function logToSupabase(data: LogPayload): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: row } = await supabase
      .from("rd_integrations")
      .insert({
        lead_id:       data.lead_id       ?? null,
        diagnostic_id: data.diagnostic_id ?? null,
        payload:       data.payload,
        status:        data.status,
        error_message: data.error_message ?? null,
        rd_contact_id: data.rd_contact_id ?? null,
        sent_at:       data.status === "success" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    return row?.id;
  } catch (err) {
    console.error("[rd/log] Supabase logging failed:", err);
    return undefined;
  }
}

async function updateLog(logId: string, update: Partial<LogPayload>): Promise<void> {
  if (!isSupabaseConfigured() || !logId) return;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase
      .from("rd_integrations")
      .update({
        status:        update.status,
        error_message: update.error_message ?? null,
        rd_contact_id: update.rd_contact_id ?? null,
        sent_at:       update.status === "success" ? new Date().toISOString() : null,
      })
      .eq("id", logId);
  } catch (err) {
    console.error("[rd/log] Update log failed:", err);
  }
}

// ─── Build RD contact payload ─────────────────────────────────────────────────
function buildContactPayload(input: RDIntegrationInput): Record<string, unknown> {
  const { engine, company_name, email, phone, job_title, website, pdf_url, lgpd_consent } = input;

  const contact: Record<string, unknown> = {
    email,
    name:         company_name,
    ...(job_title   && { job_title }),
    ...(phone       && { mobile_phone: phone }),
    ...(website     && { website }),

    // Company identifier
    cf_company: company_name,

    // Growth Planner custom fields
    cf_growth_score:    String(engine.scores.overall),
    cf_score_demanda:   String(engine.scores.demanda),
    cf_score_conversao: String(engine.scores.conversao),
    cf_score_escala:    String(engine.scores.escala),
    cf_nivel_score:     engine.scores.level,
    cf_gargalo_principal: engine.bottlenecks[0]?.type ?? "",
    cf_arquetipo_comercial: engine.maturity.archetype,

    // PDF link — the key field requested
    ...(pdf_url && { cf_link_plano_comercial: pdf_url }),

    // LGPD legal bases
    ...(lgpd_consent && {
      legal_bases: [
        { category: "communications", type: "consent", status: "granted" },
        { category: "data_processing", type: "consent", status: "granted" },
      ],
    }),
  };

  return { contact };
}

// ─── Main integration function ────────────────────────────────────────────────
export async function sendToRDStation(input: RDIntegrationInput): Promise<RDResult> {
  const payload = buildContactPayload(input);

  // Log as pending
  const logId = await logToSupabase({
    lead_id:       input.lead_id,
    diagnostic_id: input.diagnostic_id,
    payload,
    status:        "pending",
  });

  // Mock if not configured
  if (!isRDConfigured()) {
    console.log("[rd] RD_STATION_TOKEN not configured — mocking");
    if (logId) {
      await updateLog(logId, { status: "success", rd_contact_id: "mock_" + Date.now() });
    }
    return { success: true, mocked: true, log_id: logId };
  }

  // Call RD Station API
  try {
    const response = await fetch(RD_API, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.RD_STATION_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const responseText = await response.text();

    if (!response.ok) {
      const errMsg = `RD API ${response.status}: ${responseText.slice(0, 200)}`;
      console.error("[rd] API error:", errMsg);
      if (logId) await updateLog(logId, { status: "error", error_message: errMsg });
      return { success: false, mocked: false, error: errMsg, log_id: logId };
    }

    let rdUuid: string | undefined;
    try {
      const json = JSON.parse(responseText);
      rdUuid = json.uuid;
    } catch {
      // Response may not be JSON on some endpoints
    }

    if (logId) await updateLog(logId, { status: "success", rd_contact_id: rdUuid });

    console.log(`[rd] Contact upserted. UUID: ${rdUuid ?? "n/a"}`);
    return { success: true, rd_uuid: rdUuid, mocked: false, log_id: logId };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[rd] Unexpected error:", msg);
    if (logId) await updateLog(logId, { status: "error", error_message: msg });
    return { success: false, mocked: false, error: msg, log_id: logId };
  }
}
