import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type {
  SiteAnalysisInsert,
  SiteAnalysisRow,
  SiteAnalysisUpdate,
} from "@/types/tables";

const TABLE = "site_analyses";

export async function createSiteAnalysis(
  input: SiteAnalysisInsert,
): Promise<SiteAnalysisRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function updateSiteAnalysis(
  id: string,
  patch: SiteAnalysisUpdate,
): Promise<SiteAnalysisRow> {
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
 * Busca uma análise já concluída para o mesmo site, o mesmo conteúdo
 * (content_hash) E a mesma versão de prompt/modelo, para reaproveitar o
 * resultado em vez de chamar a IA de novo (cache descrito na seção 16.6
 * do BRD). Exigir prompt_version/model no match evita reaproveitar para
 * sempre um resultado antigo e mais fraco (ex.: um campo como "segment"
 * que ficou null numa versão de prompt anterior) mesmo depois do prompt
 * melhorar — mesmo padrão já usado no cache de SEO
 * (src/server/analyze-seo-opportunities.ts) e do plano comercial
 * (src/server/generate-commercial-plan.ts), que este arquivo não seguia
 * até esta correção.
 */
export async function findCachedAnalysis(
  normalizedUrl: string,
  contentHash: string,
  promptVersion: string,
  model: string,
): Promise<SiteAnalysisRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("normalized_url", normalizedUrl)
    .eq("content_hash", contentHash)
    .eq("prompt_version", promptVersion)
    .eq("model", model)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "findCached" });
}

export async function getLatestAnalysisForDiagnostic(
  diagnosticId: string,
): Promise<SiteAnalysisRow | null> {
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
