import "server-only";

/**
 * Erro de acesso a dados, lançado pelos repositórios em vez de deixar o
 * erro cru do Postgres/Supabase vazar para as camadas de cima. Cada
 * repositório informa qual operação e tabela falharam, o que ajuda tanto
 * nos logs quanto em mensagens de erro amigáveis na interface.
 */
export class DatabaseError extends Error {
  /** Nome da tabela envolvida (ex.: "companies"). */
  readonly table: string;
  /** Operação que falhou (ex.: "insert", "select", "update"). */
  readonly operation: string;
  /** Código de erro original do Postgres/PostgREST, quando disponível. */
  readonly code?: string;
  /** Erro original, para inspeção/log detalhado sem perder o stack trace. */
  readonly cause?: unknown;

  constructor(params: {
    table: string;
    operation: string;
    message: string;
    code?: string;
    cause?: unknown;
  }) {
    super(`[${params.table}.${params.operation}] ${params.message}`);
    this.name = "DatabaseError";
    this.table = params.table;
    this.operation = params.operation;
    this.code = params.code;
    this.cause = params.cause;
  }
}

/**
 * Formato mínimo comum aos erros retornados pelo cliente Supabase
 * (postgrest-js), sem depender de um tipo interno da biblioteca.
 */
type SupabaseLikeError = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * Verifica o resultado de uma chamada do Supabase (`{ data, error }`) e
 * lança um DatabaseError legível em caso de falha. Uso típico:
 *
 *   const result = await supabase.from("companies").insert(input).select().single();
 *   return unwrap(result, { table: "companies", operation: "insert" });
 *
 * Use quando "nenhuma linha encontrada" é, em si, um erro (ex.: depois
 * de um insert/update que deveria sempre retornar a linha afetada).
 */
export function unwrap<T>(
  result: { data: T | null; error: SupabaseLikeError | null },
  context: { table: string; operation: string },
): T {
  if (result.error) {
    throw new DatabaseError({
      table: context.table,
      operation: context.operation,
      message: result.error.message,
      code: result.error.code,
      cause: result.error,
    });
  }

  if (result.data === null) {
    throw new DatabaseError({
      table: context.table,
      operation: context.operation,
      message: "Nenhum dado retornado pela operação.",
    });
  }

  return result.data;
}

/**
 * Igual a unwrap(), mas para consultas em que "nenhum resultado" é uma
 * resposta legítima (ex.: buscar uma empresa que ainda não existe) — não
 * lança erro quando data é null, apenas quando result.error existe.
 */
export function unwrapMaybe<T>(
  result: { data: T | null; error: SupabaseLikeError | null },
  context: { table: string; operation: string },
): T | null {
  if (result.error) {
    throw new DatabaseError({
      table: context.table,
      operation: context.operation,
      message: result.error.message,
      code: result.error.code,
      cause: result.error,
    });
  }

  return result.data;
}
