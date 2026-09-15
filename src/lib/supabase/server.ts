import "server-only";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e
 * Route Handlers, respeitando a sessão do usuário via cookies.
 *
 * Assim como o cliente de navegador, usa a chave anônima e continua
 * sujeito às políticas de Row Level Security (RLS). Para operações
 * privilegiadas que precisam ignorar o RLS (ex.: rotinas internas de
 * geração de relatório), use "src/lib/supabase/admin.ts".
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { parseClientEnv } from "@/config/env.client";
import type { Database } from "@/types/database";

/**
 * Cria uma instância do cliente Supabase de servidor para a requisição
 * atual. Deve ser criada por requisição (não é um singleton), pois cada
 * requisição tem seus próprios cookies/sessão.
 */
export async function createSupabaseServerClient() {
  const env = parseClientEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // "setAll" pode ser chamado a partir de um Server Component,
            // onde não é possível escrever cookies. Isso é esperado e
            // pode ser ignorado com segurança quando há um middleware
            // responsável por renovar a sessão.
          }
        },
      },
    },
  );
}
