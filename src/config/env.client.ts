/**
 * Variáveis de ambiente seguras para o navegador (client-side).
 *
 * Regra de segurança: este arquivo só pode conter variáveis com o
 * prefixo "NEXT_PUBLIC_". Nunca adicione uma chave secreta aqui —
 * qualquer variável validada por este schema pode acabar visível no
 * código enviado ao navegador do usuário.
 *
 * Para segredos de servidor (chaves de API, service role, etc.),
 * utilize "src/config/env.server.ts".
 */
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_URL é obrigatória." })
    .url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória." })
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY não pode ser vazia."),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Valida e retorna as variáveis públicas de ambiente.
 * Lança um erro legível caso alguma variável esteja ausente ou inválida,
 * em vez de falhar silenciosamente em tempo de execução.
 */
function parseClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variáveis de ambiente públicas inválidas ou ausentes:\n${details}\n\n` +
        "Confira o arquivo .env.local com base em .env.example.",
    );
  }

  return result.data;
}

export { clientEnvSchema, parseClientEnv };
