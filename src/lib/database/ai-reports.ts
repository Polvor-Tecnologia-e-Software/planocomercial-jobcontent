import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DatabaseError, unwrap, unwrapMaybe } from "@/lib/database/errors";
import type {
  AiReportInsert,
  AiReportRow,
  AiReportStatus,
  AiReportType,
} from "@/types/tables";

const TABLE = "ai_reports";

export async function createAiReport(input: AiReportInsert): Promise<AiReportRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function updateAiReportStatus(
  id: string,
  status: AiReportStatus,
  patch?: Partial<AiReportInsert>,
): Promise<AiReportRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .update({ ...patch, status })
    .eq("id", id)
    .select("*")
    .single();

  return unwrap(result, { table: TABLE, operation: "updateStatus" });
}

/**
 * Busca uma chamada de IA já validada com o mesmo tipo e o mesmo hash de
 * entrada — permite reaproveitar a resposta em vez de chamar o modelo de
 * novo (idempotência/cache descritos nas seções 16.3 e 16.6 do BRD).
 */
export async function findCachedReport(
  reportType: AiReportType,
  inputHash: string,
): Promise<AiReportRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("report_type", reportType)
    .eq("input_hash", inputHash)
    .eq("status", "validated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "findCached" });
}

/**
 * Busca o relatório mais recente de um tipo para o diagnóstico —
 * independente de status (pode estar "generating"/"failed"/"validated").
 * Usada pela tela de resultado para decidir qual estado mostrar (ainda
 * não gerado, gerando, falhou, pronto) sem precisar saber o hash de
 * entrada de antemão.
 */
export async function getLatestReport(
  diagnosticId: string,
  reportType: AiReportType,
): Promise<AiReportRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .eq("report_type", reportType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "getLatest" });
}

/**
 * Conta quantas chamadas de IA já foram feitas para este diagnóstico —
 * usada pelo AIOrchestrator para impor o limite de 2 a 3 chamadas por
 * diagnóstico (seção 16.3 e critério de aceite da seção 22).
 *
 * `reportType` filtra por tipo (ex.: "diagnostic_plan") — sem isso, uma
 * análise de site já feita para o diagnóstico contaria para o mesmo
 * limite de tentativas do plano comercial, que é um relatório diferente.
 */
export async function countReportsForDiagnostic(
  diagnosticId: string,
  reportType?: AiReportType,
): Promise<number> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("diagnostic_id", diagnosticId);

  if (reportType) {
    query = query.eq("report_type", reportType);
  }

  const { count, error } = await query;

  if (error) {
    throw new DatabaseError({
      table: TABLE,
      operation: "countForDiagnostic",
      message: error.message,
      code: error.code,
      cause: error,
    });
  }

  return count ?? 0;
}
