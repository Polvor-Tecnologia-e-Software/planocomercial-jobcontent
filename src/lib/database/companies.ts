import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import { normalizeWebsite } from "@/lib/database/normalize-website";
import type { CompanyInsert, CompanyRow, CompanyUpdate } from "@/types/tables";

const TABLE = "companies";

/**
 * Busca uma empresa pela URL normalizada do site. Usada para deduplicar
 * empresas quando o mesmo domínio inicia um novo diagnóstico (seção 16.6
 * do BRD trata o mesmo princípio para cache de análise de site).
 * Retorna null quando não encontrada (não é um erro).
 */
export async function findCompanyByWebsite(website: string): Promise<CompanyRow | null> {
  const normalized = normalizeWebsite(website);
  if (!normalized) return null;

  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("normalized_website", normalized)
    .maybeSingle();

  return unwrapMaybe(result, { table: TABLE, operation: "findByWebsite" });
}

export async function getCompanyById(id: string): Promise<CompanyRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  return unwrapMaybe(result, { table: TABLE, operation: "getById" });
}

export async function createCompany(input: CompanyInsert): Promise<CompanyRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

/**
 * Encontra a empresa pelo site normalizado ou cria uma nova, caso não
 * exista. Evita duplicar o registro da empresa quando a mesma pessoa (ou
 * outra pessoa da mesma empresa) reinicia o diagnóstico mais tarde.
 */
export async function findOrCreateCompany(input: CompanyInsert): Promise<CompanyRow> {
  if (input.website) {
    const existing = await findCompanyByWebsite(input.website);
    if (existing) return existing;
  }

  return createCompany(input);
}

export async function updateCompany(
  id: string,
  patch: CompanyUpdate,
): Promise<CompanyRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  return unwrap(result, { table: TABLE, operation: "update" });
}
