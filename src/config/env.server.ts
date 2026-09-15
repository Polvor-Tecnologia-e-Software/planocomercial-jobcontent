/**
 * Variáveis de ambiente exclusivas de servidor.
 *
 * O import "server-only" garante que, se este arquivo for importado por
 * engano a partir de um Client Component, o build falha imediatamente
 * em vez de vazar segredos no bundle enviado ao navegador.
 *
 * Nunca importe este arquivo em:
 * - componentes com "use client";
 * - qualquer código que rode no navegador.
 */
import "server-only";
import { z } from "zod";

/**
 * Campo de ambiente opcional que trata string vazia ("") como ausente
 * (undefined), não como inválida. Necessário porque uma variável deixada
 * em branco de propósito no .env.local (ex.: "RD_STATION_CLIENT_ID=")
 * chega aqui como "", não como undefined — sem este preprocess, .min(1)
 * rejeitaria esse valor e quebraria a validação inteira (todas as
 * variáveis são validadas juntas), mesmo para fluxos sem nenhuma relação
 * com o campo vazio.
 */
function optionalEnvString(message: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1, message).optional(),
  );
}

const serverEnvSchema = z.object({
  // Supabase (uso privilegiado, ignora RLS — restrito a rotinas de servidor)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ error: "SUPABASE_SERVICE_ROLE_KEY é obrigatória." })
    .min(1, "SUPABASE_SERVICE_ROLE_KEY não pode ser vazia."),

  // Inteligência artificial
  AI_API_KEY: z
    .string({ error: "AI_API_KEY é obrigatória." })
    .min(1, "AI_API_KEY não pode ser vazia."),
  AI_MODEL: z
    .string({ error: "AI_MODEL é obrigatória." })
    .min(1, "AI_MODEL não pode ser vazia."),

  // RD Station — Conversões via API Key (única forma usada hoje, ver
  // src/lib/rd-station/). Opcional de propósito: a ausência desta variável
  // desativa silenciosamente só essa integração (ver
  // src/server/send-rd-station-conversion.ts) — nunca impede o resto da
  // aplicação (diagnóstico, plano, PDF) de funcionar normalmente.
  RD_STATION_API_KEY: optionalEnvString("RD_STATION_API_KEY não pode ser vazia."),

  // Reservadas para uma eventual integração OAuth futura (ex.: RD Station
  // CRM, ou algum fluxo que realmente precise de token renovável) — NÃO
  // consumidas pela integração de conversão via API Key acima. Mantidas
  // aqui (em vez de removidas) porque já estavam reservadas antes desta
  // etapa; seguem opcionais e sem uso até que algo realmente as leia.
  RD_STATION_CLIENT_ID: optionalEnvString("RD_STATION_CLIENT_ID não pode ser vazia."),
  RD_STATION_CLIENT_SECRET: optionalEnvString("RD_STATION_CLIENT_SECRET não pode ser vazia."),
  RD_STATION_REFRESH_TOKEN: optionalEnvString("RD_STATION_REFRESH_TOKEN não pode ser vazia."),

  // Aplicação
  APP_URL: z
    .string({ error: "APP_URL é obrigatória." })
    .url("APP_URL deve ser uma URL válida."),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Valida e retorna as variáveis de ambiente de servidor.
 * Lança um erro legível (com a lista de variáveis ausentes/ inválidas)
 * em vez de deixar o erro estourar mais tarde, em produção, no meio de
 * uma chamada de IA ou de uma integração externa.
 */
function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    RD_STATION_API_KEY: process.env.RD_STATION_API_KEY,
    RD_STATION_CLIENT_ID: process.env.RD_STATION_CLIENT_ID,
    RD_STATION_CLIENT_SECRET: process.env.RD_STATION_CLIENT_SECRET,
    RD_STATION_REFRESH_TOKEN: process.env.RD_STATION_REFRESH_TOKEN,
    APP_URL: process.env.APP_URL,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variáveis de ambiente de servidor inválidas ou ausentes:\n${details}\n\n` +
        "Confira o arquivo .env.local com base em .env.example.",
    );
  }

  return result.data;
}

export { serverEnvSchema, parseServerEnv };
