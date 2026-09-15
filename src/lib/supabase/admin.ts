import "server-only";

/**
 * Cliente Supabase privilegiado (service role).
 *
 * Este cliente IGNORA o Row Level Security (RLS). Deve ser usado
 * exclusivamente por rotinas internas de servidor que precisam de
 * acesso administrativo ao banco — por exemplo:
 * - geração do diagnóstico final e do PDF;
 * - webhooks de integrações (RD Station);
 * - jobs de manutenção/limpeza.
 *
 * NUNCA:
 * - importe este arquivo em um Client Component;
 * - use este cliente para responder diretamente a uma requisição feita
 *   pelo navegador sem antes validar autenticação/autorização;
 * - exponha o resultado de queries feitas com este cliente sem checar
 *   se o dado pertence ao usuário/diagnóstico correto.
 */
import { createClient } from "@supabase/supabase-js";

import { parseClientEnv } from "@/config/env.client";
import { parseServerEnv } from "@/config/env.server";
import type { Database } from "@/types/database";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Retorna uma instância (singleton) do cliente Supabase administrativo.
 * A criação é adiada para o primeiro uso (lazy), então este módulo pode
 * ser importado com segurança sem exigir as variáveis de ambiente até
 * que o cliente seja de fato utilizado.
 */
export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const clientEnv = parseClientEnv();
  const serverEnv = parseServerEnv();

  adminClient = createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
}
