/**
 * Espelha a função SQL normalize_website() (ver migration
 * 20260731100000_extensions_and_helpers.sql). Necessário no lado do
 * TypeScript porque o banco só normaliza a coluna "website" da própria
 * linha ao salvar — para *consultar* uma empresa pelo site informado
 * pelo usuário, precisamos normalizar o valor antes de montar o filtro.
 *
 * Mantenha esta função sincronizada com a versão em SQL caso uma altere.
 */
export function normalizeWebsite(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || rawUrl.trim() === "") {
    return null;
  }

  let result = rawUrl.trim().toLowerCase();
  result = result.replace(/^[a-z]+:\/\//, "");
  result = result.replace(/^www\./, "");
  result = result.replace(/\/+$/, "");
  result = result.split("/")[0];
  result = result.split("?")[0];

  return result === "" ? null : result;
}
