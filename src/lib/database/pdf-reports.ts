import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { PdfReportInsert, PdfReportRow, PdfStatus } from "@/types/tables";

const TABLE = "pdf_reports";

export async function createPdfReport(input: PdfReportInsert): Promise<PdfReportRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function updatePdfReportStatus(
  id: string,
  status: PdfStatus,
  patch?: Partial<PdfReportInsert>,
): Promise<PdfReportRow> {
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
 * Retorna a versão mais recente do PDF de um diagnóstico (a seção 11
 * exige que o PDF seja privado, com UUID não previsível e URL assinada
 * gerada sob demanda — nunca armazenamos a URL pública aqui).
 */
export async function getLatestPdfReport(
  diagnosticId: string,
): Promise<PdfReportRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "getLatest" });
}
