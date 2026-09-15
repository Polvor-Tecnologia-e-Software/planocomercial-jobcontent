import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { DiagnosticInsert, DiagnosticRow, DiagnosticUpdate } from "@/types/tables";

const TABLE = "diagnostics";

export async function createDiagnostic(input: DiagnosticInsert): Promise<DiagnosticRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function getDiagnosticById(id: string): Promise<DiagnosticRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  return unwrapMaybe(result, { table: TABLE, operation: "getById" });
}

export async function updateDiagnostic(
  id: string,
  patch: DiagnosticUpdate,
): Promise<DiagnosticRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  return unwrap(result, { table: TABLE, operation: "update" });
}

/**
 * Atalho para transições de status (seção 17 do BRD). Mantido separado
 * de updateDiagnostic() para deixar explícito, no restante do código,
 * quando uma mudança de status está acontecendo (útil para log/analytics).
 */
export async function transitionDiagnosticStatus(
  id: string,
  status: DiagnosticRow["status"],
): Promise<DiagnosticRow> {
  return updateDiagnostic(id, { status });
}

/**
 * Marca o diagnóstico como concluído, preenchendo completed_at.
 */
export async function completeDiagnostic(id: string): Promise<DiagnosticRow> {
  return updateDiagnostic(id, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
}
