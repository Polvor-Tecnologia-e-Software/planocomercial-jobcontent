import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { SeoAnalysisInsert, SeoAnalysisRow, SeoAnalysisUpdate } from "@/types/tables";

const TABLE = "seo_analyses";

export async function createSeoAnalysis(input: SeoAnalysisInsert): Promise<SeoAnalysisRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function updateSeoAnalysis(id: string, patch: SeoAnalysisUpdate): Promise<SeoAnalysisRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).update(patch).eq("id", id).select("*").single();
  return unwrap(result, { table: TABLE, operation: "update" });
}

/**
 * Busca uma análise já concluída para o mesmo diagnóstico e o mesmo
 * hash de conteúdo (palavras-chave + site) — reaproveita em vez de
 * chamar a IA de novo, mesma lógica de cache de site_analyses.
 */
export async function findCachedAnalysis(
  diagnosticId: string,
  contentHash: string,
): Promise<SeoAnalysisRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .eq("content_hash", contentHash)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "findCached" });
}

export async function getLatestAnalysisForDiagnostic(diagnosticId: string): Promise<SeoAnalysisRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("diagnostic_id", diagnosticId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "getLatestForDiagnostic" });
}
