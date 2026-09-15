import "server-only";

/**
 * Endpoint oficial de Conversão (RD Station Marketing — CDP), documentado em
 * https://developers.rdstation.com/reference/conversao. Autenticação por
 * API Key (query string), nunca OAuth — ver src/lib/rd-station/client.ts.
 */
export const RD_STATION_CONVERSIONS_ENDPOINT = "https://api.rd.services/platform/conversions";

/**
 * Identificador estável desta conversão no RD Station. Usado tanto no
 * payload (payload.conversion_identifier) quanto como event_name em
 * rd_integrations, para a checagem de idempotência (um evento por
 * diagnóstico — ver supabase/schema.sql). Centralizado aqui de propósito:
 * nenhuma outra parte do código deve repetir essa string.
 */
export const RD_CONVERSION_IDENTIFIER = "plano-comercial-90-dias";
