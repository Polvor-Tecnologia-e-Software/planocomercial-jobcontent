import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap } from "@/lib/database/errors";
import type { DiagnosticScoreInsert, DiagnosticScoreRow } from "@/types/tables";

const TABLE = "diagnostic_scores";

/**
 * Grava (ou atualiza) o score de uma dimensão para o diagnóstico.
 * Upsert por (diagnostic_id, dimension), conforme a constraint única da
 * migration — uma dimensão tem no máximo um score por diagnóstico.
 */
export async function upsertScore(
  input: DiagnosticScoreInsert,
): Promise<DiagnosticScoreRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .upsert(input, { onConflict: "diagnostic_id,dimension" })
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "upsert" });
}

export async function listScores(diagnosticId: string): Promise<DiagnosticScoreRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("diagnostic_id", diagnosticId);
  return unwrap(result, { table: TABLE, operation: "list" });
}
