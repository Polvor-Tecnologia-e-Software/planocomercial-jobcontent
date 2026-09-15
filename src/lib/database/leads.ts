import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unwrap, unwrapMaybe } from "@/lib/database/errors";
import type { LeadInsert, LeadRow, LeadUpdate } from "@/types/tables";

const TABLE = "leads";

export async function createLead(input: LeadInsert): Promise<LeadRow> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).insert(input).select("*").single();
  return unwrap(result, { table: TABLE, operation: "insert" });
}

export async function getLeadById(id: string): Promise<LeadRow | null> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  return unwrapMaybe(result, { table: TABLE, operation: "getById" });
}

export async function updateLead(id: string, patch: LeadUpdate): Promise<LeadRow> {
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
 * Registra o consentimento LGPD do lead (seção 4 e 19 do BRD:
 * "Consentimento versionado"). Sempre grava a versão do texto aceito
 * junto com o consentimento, nunca só o booleano.
 */
export async function recordConsent(
  id: string,
  consentVersion: string,
): Promise<LeadRow> {
  return updateLead(id, { consent_given: true, consent_version: consentVersion });
}
