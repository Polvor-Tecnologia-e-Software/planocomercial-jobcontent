import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap } from "@/lib/database/errors";
import type { AnswerSource, DiagnosticAnswerRow } from "@/types/tables";

const TABLE = "diagnostic_answers";

/**
 * Grava ou atualiza a resposta de uma pergunta (upsert por
 * (diagnostic_id, question_key), conforme a constraint única da
 * migration). Reflete a regra da seção 8.3 do BRD: cada pergunta tem uma
 * única resposta "atual" por diagnóstico.
 */
export async function upsertAnswer(params: {
  diagnosticId: string;
  questionKey: string;
  answerValue: unknown;
  answerSource: AnswerSource;
  confirmed?: boolean;
}): Promise<DiagnosticAnswerRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .upsert(
      {
        diagnostic_id: params.diagnosticId,
        question_key: params.questionKey,
        answer_value: params.answerValue,
        answer_source: params.answerSource,
        confirmed: params.confirmed ?? false,
      },
      { onConflict: "diagnostic_id,question_key" },
    )
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "upsert" });
}

export async function listAnswers(diagnosticId: string): Promise<DiagnosticAnswerRow[]> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .order("created_at", { ascending: true });

  return unwrap(result, { table: TABLE, operation: "list" });
}
