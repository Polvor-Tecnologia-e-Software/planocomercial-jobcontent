import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap } from "@/lib/database/errors";
import type { AnalyticsEventInsert, AnalyticsEventRow } from "@/types/tables";

const TABLE = "analytics_events";

/**
 * Registra um evento de produto (seção 20 do BRD). Chamado a partir de
 * Route Handlers/Server Actions — nunca diretamente do navegador (ver
 * nota de RLS na migration desta tabela).
 */
export async function trackEvent(
  input: AnalyticsEventInsert,
): Promise<AnalyticsEventRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function listEventsForDiagnostic(
  diagnosticId: string,
): Promise<AnalyticsEventRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .order("created_at", { ascending: true });

  return unwrap(result, { table: TABLE, operation: "listForDiagnostic" });
}
