import "server-only";

import { headers } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Limitador de taxa de janela fixa, apoiado na tabela "rate_limits" do
 * Supabase em vez de memória do processo — necessário porque a aplicação
 * roda em funções serverless (Vercel): cada instância/região teria sua
 * própria memória, então um limitador em memória de processo não
 * protegeria nada na prática contra abuso distribuído.
 *
 * A gravação é atômica via a função SQL increment_rate_limit (ver
 * supabase/schema.sql: INSERT ... ON CONFLICT DO UPDATE em uma única
 * instrução), então requisições simultâneas do mesmo identificador não
 * conseguem burlar o limite por condição de corrida.
 *
 * Nunca lança: uma falha do próprio limitador (ex.: Supabase
 * temporariamente indisponível) não deve impedir o uso normal da
 * aplicação — nesse caso, a chamada é liberada e o erro é logado.
 */
export async function checkRateLimit(params: {
  /** Nome curto da operação sendo limitada, ex.: "start_diagnostic". */
  action: string;
  /** Quem está sendo limitado, tipicamente o IP do chamador (ver getClientIp). */
  identifier: string;
  /** Quantas chamadas permitir por janela. */
  limit: number;
  /** Duração da janela, em segundos. */
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { action, identifier, limit, windowSeconds } = params;
  const windowMs = windowSeconds * 1000;
  const bucketStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStart = new Date(bucketStartMs);
  const key = `${action}:${identifier}:${windowStart.toISOString()}`;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_key: key,
      p_window_start: windowStart.toISOString(),
    });

    if (error) {
      console.error("[rate-limit] increment_rate_limit failed:", error.message);
      return { allowed: true };
    }

    const count = typeof data === "number" ? data : Number(data);
    if (Number.isFinite(count) && count > limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucketStartMs + windowMs - Date.now()) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[rate-limit] unexpected error:", err);
    return { allowed: true };
  }
}

/**
 * Extrai o IP do chamador a partir dos cabeçalhos de proxy (a Vercel
 * define x-forwarded-for automaticamente). Nunca é uma identidade
 * confiável — só serve para agrupar tentativas ao limitar taxa. Nunca use
 * o valor retornado para autorização ou para decisões de segurança além
 * do rate limiting.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerList.get("x-real-ip") ?? "unknown";
}
