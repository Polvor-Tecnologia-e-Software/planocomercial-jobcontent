import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DatabaseError, unwrap } from "@/lib/database/errors";
import type {
  ActionLibraryRow,
  DiagnosticActionInsert,
  DiagnosticActionRow,
} from "@/types/tables";

const TABLE = "diagnostic_actions";

/**
 * Grava as ações selecionadas pela IA (por action_code, resolvido para
 * action_library_id) para um diagnóstico. Substitui qualquer seleção
 * anterior do mesmo diagnóstico, para o caso de regeneração parcial do
 * plano (seção 16.6/22 do BRD).
 */
export async function assignActions(
  diagnosticId: string,
  actions: DiagnosticActionInsert[],
): Promise<DiagnosticActionRow[]> {
  const supabase = createSupabaseAdminClient();

  const del = await supabase.from(TABLE).delete().eq("diagnostic_id", diagnosticId);
  if (del.error) {
    throw new DatabaseError({
      table: TABLE,
      operation: "deleteBeforeAssign",
      message: del.error.message,
      code: del.error.code,
      cause: del.error,
    });
  }

  if (actions.length === 0) return [];

  const result = await supabase.from(TABLE).insert(actions).select("*");
  return unwrap(result, { table: TABLE, operation: "insertMany" });
}

export type DiagnosticActionWithDetails = DiagnosticActionRow & {
  action: ActionLibraryRow;
};

/**
 * Lista as ações do diagnóstico já com os dados completos do catálogo
 * (título, descrição, indicador padrão, etc.), prontas para montar a
 * Tela 10 (Resultado) e o PDF sem precisar de uma segunda consulta.
 */
export async function listActionsForDiagnostic(
  diagnosticId: string,
): Promise<DiagnosticActionWithDetails[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*, action:action_library(*)")
    .eq("diagnostic_id", diagnosticId)
    .order("phase", { ascending: true })
    .order("priority_order", { ascending: true });

  return unwrap(result, {
    table: TABLE,
    operation: "listWithDetails",
  }) as unknown as DiagnosticActionWithDetails[];
}
