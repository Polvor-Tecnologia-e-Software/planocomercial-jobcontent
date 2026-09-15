import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DatabaseError, unwrap } from "@/lib/database/errors";
import type { DiagnosticSignalInsert, DiagnosticSignalRow } from "@/types/tables";

const TABLE = "diagnostic_signals";

export async function addSignal(
  input: DiagnosticSignalInsert,
): Promise<DiagnosticSignalRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

/**
 * Grava vários sinais de uma vez (uso típico: ao final do processamento
 * determinístico de um bloco de perguntas, várias evidências surgem
 * juntas — seção 10.3 do BRD).
 */
export async function addSignals(
  inputs: DiagnosticSignalInsert[],
): Promise<DiagnosticSignalRow[]> {
  if (inputs.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(inputs).select("*");
  return unwrap(result, { table: TABLE, operation: "insertMany" });
}

export async function listSignals(diagnosticId: string): Promise<DiagnosticSignalRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("diagnostic_id", diagnosticId);
  return unwrap(result, { table: TABLE, operation: "list" });
}

/**
 * Substitui todos os sinais de um diagnóstico pelo conjunto informado
 * (delete + insert, mesmo padrão de diagnostic_actions.assignActions) —
 * necessário porque, diferente de diagnostic_scores/funnel_analyses, não
 * há uma constraint única para fazer upsert aqui, e o motor determinístico
 * pode ser recalculado mais de uma vez para o mesmo diagnóstico (ex.: a
 * cada vez que a jornada retoma em "prediagnosis_ready"). Sem isso, sinais
 * duplicariam a cada recálculo.
 */
export async function replaceSignals(
  diagnosticId: string,
  inputs: DiagnosticSignalInsert[],
): Promise<DiagnosticSignalRow[]> {
  const supabase = createSupabaseAdminClient();

  const del = await supabase.from(TABLE).delete().eq("diagnostic_id", diagnosticId);
  if (del.error) {
    throw new DatabaseError({
      table: TABLE,
      operation: "deleteBeforeReplace",
      message: del.error.message,
      code: del.error.code,
      cause: del.error,
    });
  }

  if (inputs.length === 0) return [];

  const result = await supabase.from(TABLE).insert(inputs).select("*");
  return unwrap(result, { table: TABLE, operation: "insertMany" });
}
