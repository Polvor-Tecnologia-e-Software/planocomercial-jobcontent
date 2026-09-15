import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DatabaseError, unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { RdIntegrationInsert, RdIntegrationRow } from "@/types/tables";

const TABLE = "rd_integrations";
/** Código Postgres de violação de unicidade (usado por createIntegrationIfAbsent). */
const UNIQUE_VIOLATION_CODE = "23505";

export async function findIntegrationByEvent(
  diagnosticId: string,
  eventName: string,
): Promise<RdIntegrationRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .eq("event_name", eventName)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "findByEvent" });
}

/**
 * Cria o registro de intenção de envio, de forma segura contra corrida
 * (clique duplo, duas abas, chamadas paralelas): tenta inserir e, se
 * colidir com uma linha já existente (constraint única em
 * diagnostic_id + event_name — ver supabase/schema.sql), busca e
 * reaproveita essa linha em vez de tratar como erro ou duplicar o envio.
 * Nunca faz upsert com "update on conflict" aqui de propósito — isso
 * reiniciaria silenciosamente o status/tentativas de uma linha que já
 * pode estar "sent".
 */
export async function createIntegrationIfAbsent(
  input: RdIntegrationInsert,
): Promise<{ row: RdIntegrationRow; created: boolean }> {
  const supabase = createSupabaseAdminClient();
  const insertResult = await supabase.from(TABLE).insert(input).select("*").single();

  if (!insertResult.error) {
    return { row: unwrap(insertResult, { table: TABLE, operation: "insert" }), created: true };
  }

  if (insertResult.error.code === UNIQUE_VIOLATION_CODE) {
    const existing = await findIntegrationByEvent(input.diagnostic_id, input.event_name);
    if (existing) return { row: existing, created: false };
  }

  throw new DatabaseError({
    table: TABLE,
    operation: "insert",
    message: insertResult.error.message,
    code: insertResult.error.code,
    cause: insertResult.error,
  });
}

export async function markIntegrationSent(id: string): Promise<RdIntegrationRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "markSent" });
}

/**
 * Marca uma falha TEMPORÁRIA (timeout, rede, 5xx, rate limit) — status
 * "retrying", elegível a uma nova tentativa em uma próxima chamada.
 * Diferente de markIntegrationPermanentlyFailed, que é para erros que
 * repetir não corrige (validação, autenticação).
 */
export async function markIntegrationFailed(
  id: string,
  errorMessage: string,
): Promise<RdIntegrationRow> {
  const supabase = createSupabaseAdminClient();

  // Lê o número de tentativas atual para incrementar de forma segura.
  const current = await supabase.from(TABLE).select("attempts").eq("id", id).single();
  const attempts = unwrap(current, { table: TABLE, operation: "readAttempts" });

  const result = await supabase
    .from(TABLE)
    .update({
      status: "retrying",
      attempts: attempts.attempts + 1,
      last_error: errorMessage,
    })
    .eq("id", id)
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "markFailed" });
}

/**
 * Marca uma falha PERMANENTE (erro de validação do payload, API Key
 * inválida, ou limite de tentativas esgotado) — status "failed", nunca
 * mais tentada automaticamente.
 */
export async function markIntegrationPermanentlyFailed(
  id: string,
  errorMessage: string,
): Promise<RdIntegrationRow> {
  const supabase = createSupabaseAdminClient();

  const current = await supabase.from(TABLE).select("attempts").eq("id", id).single();
  const attempts = unwrap(current, { table: TABLE, operation: "readAttempts" });

  const result = await supabase
    .from(TABLE)
    .update({
      status: "failed",
      attempts: attempts.attempts + 1,
      last_error: errorMessage,
    })
    .eq("id", id)
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "markPermanentlyFailed" });
}

export async function listPendingIntegrations(): Promise<RdIntegrationRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .in("status", ["pending", "retrying"]);

  if (result.error) {
    throw new DatabaseError({
      table: TABLE,
      operation: "listPending",
      message: result.error.message,
      code: result.error.code,
      cause: result.error,
    });
  }

  return result.data ?? [];
}
