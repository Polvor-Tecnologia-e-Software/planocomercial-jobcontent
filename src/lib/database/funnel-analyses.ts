import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { FunnelAnalysisInsert, FunnelAnalysisRow } from "@/types/tables";

const TABLE = "funnel_analyses";

export async function getFunnelAnalysis(
  diagnosticId: string,
): Promise<FunnelAnalysisRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "get" });
}

/**
 * Grava o resultado mais recente da engenharia reversa da meta e do
 * funil (seção 7 do BRD). Como o funil é recalculado conforme o usuário
 * responde novas perguntas, fazemos upsert por diagnostic_id (constraint
 * única na tabela) em vez de acumular várias linhas — o BRD não pede
 * histórico de versões do funil, apenas o estado atual.
 */
export async function upsertFunnelAnalysis(
  input: FunnelAnalysisInsert,
): Promise<FunnelAnalysisRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .upsert(input, { onConflict: "diagnostic_id" })
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "upsert" });
}
