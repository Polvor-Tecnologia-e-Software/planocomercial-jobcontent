import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { ActionLibraryRow, Dimension } from "@/types/tables";

const TABLE = "action_library";

export async function listActiveActions(): Promise<ActionLibraryRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("is_active", true);
  return unwrap(result, { table: TABLE, operation: "listActive" });
}

/**
 * Lista as ações ativas candidatas para uma dimensão (e, opcionalmente,
 * fase do plano de 90 dias) — usada para montar candidate_action_ids no
 * AIContext (seção 16.4 do BRD), antes de chamar a IA.
 */
export async function listActiveActionsByDimension(
  dimension: Dimension,
  phase?: ActionLibraryRow["default_phase"],
): Promise<ActionLibraryRow[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .eq("dimension", dimension);

  if (phase) {
    query = query.eq("default_phase", phase);
  }

  const result = await query;
  return unwrap(result, { table: TABLE, operation: "listActiveByDimension" });
}

export async function getActionByCode(
  actionCode: string,
): Promise<ActionLibraryRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("action_code", actionCode)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "getByCode" });
}
