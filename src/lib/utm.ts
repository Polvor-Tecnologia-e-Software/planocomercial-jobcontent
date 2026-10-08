/**
 * Persistência dos UTMs de campanha por toda a jornada (pedido explícito:
 * "a utm das campanhas persista em todas as páginas, até o fim"). Sem
 * isso, os UTMs só existiam na URL da primeira tela — o redirecionamento
 * para /diagnostico/[id] (e todos os seguintes) os descartava.
 *
 * Funciona em duas pontas, com este módulo compartilhado entre elas:
 * - no navegador (src/components/analytics/utm-persistence.tsx): grava os
 *   UTMs da URL num cookie de sessão e os recoloca na URL de qualquer tela
 *   que chegue sem eles;
 * - no servidor (src/server/utm.ts): lê esse cookie e acrescenta os UTMs
 *   a todo redirect() das Server Actions, para a URL já nascer com eles.
 */

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

/** Cookie de sessão (some ao fechar o navegador) — não leva UTMs antigos para uma visita futura sem campanha. */
export const UTM_COOKIE_NAME = "jc_utm";

const MAX_UTM_VALUE_LENGTH = 200;

function cleanValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > MAX_UTM_VALUE_LENGTH) return undefined;
  return trimmed;
}

/** Só os utm_* válidos de uma query string (ou URLSearchParams). */
export function pickUtmParams(source: URLSearchParams | string | null | undefined): UtmParams {
  if (!source) return {};
  const params = typeof source === "string" ? new URLSearchParams(source) : source;
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = cleanValue(params.get(key));
    if (value) result[key] = value;
  }
  return result;
}

export function hasUtmParams(params: UtmParams): boolean {
  return Object.keys(params).length > 0;
}

/** UtmParams -> "utm_source=...&utm_medium=..." (vazio quando não há nenhum). */
export function serializeUtmParams(params: UtmParams): string {
  const query = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  return query.toString();
}

/**
 * Acrescenta os UTMs a um caminho interno, preservando a query que ele já
 * tenha (ex.: "?analysisError=1"). Se o caminho já traz algum utm_*, não
 * acrescenta nada — nunca mistura parâmetros de duas campanhas.
 */
export function appendUtmParams(path: string, params: UtmParams): string {
  if (!hasUtmParams(params)) return path;
  const [base, existingQuery = ""] = path.split("?");
  const query = new URLSearchParams(existingQuery);
  if (UTM_KEYS.some((key) => query.has(key))) return path;
  for (const key of UTM_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}
