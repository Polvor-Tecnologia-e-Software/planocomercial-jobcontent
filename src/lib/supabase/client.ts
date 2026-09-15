"use client";

/**
 * Cliente Supabase para uso no navegador (Client Components).
 *
 * Usa apenas a URL pública e a chave anônima — nunca a service role.
 * O acesso aos dados é limitado pelas políticas de Row Level Security
 * (RLS) configuradas no Supabase, então este cliente é seguro para
 * rodar no navegador do usuário.
 */
import { createBrowserClient } from "@supabase/ssr";

import { parseClientEnv } from "@/config/env.client";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Retorna uma instância (singleton) do cliente Supabase de navegador.
 * A criação é adiada para o primeiro uso (lazy) para evitar custo
 * desnecessário em componentes que nunca chegam a consultar o Supabase.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = parseClientEnv();

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
