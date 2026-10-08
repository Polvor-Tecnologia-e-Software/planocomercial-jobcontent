import "server-only";

/**
 * Endpoint oficial de Conversão (RD Station Marketing — CDP), documentado em
 * https://developers.rdstation.com/reference/conversao. Autenticação por
 * API Key (query string), nunca OAuth — ver src/lib/rd-station/client.ts.
 */
export const RD_STATION_CONVERSIONS_ENDPOINT = "https://api.rd.services/platform/conversions";

/**
 * Identificadores das conversões no RD Station. Usados tanto no payload
 * (payload.conversion_identifier) quanto como event_name em
 * rd_integrations, para a checagem de idempotência (um evento de cada
 * tipo por diagnóstico — ver supabase/schema.sql). Centralizados aqui:
 * nenhuma outra parte do código deve repetir essas strings.
 *
 * O evento de plano pronto se chamava "plano-comercial-90-dias" até a
 * versão 03 — renomeado a pedido explícito; automações/segmentações da RD
 * que usavam o nome antigo precisam ser atualizadas no painel.
 */
export const RD_CONVERSION_IDENTIFIERS = {
  /** Envio do formulário inicial (nome, e-mail, empresa, site). */
  capture: "plano-comercial-90-dias-captura",
  /** Plano pronto (já com telefone, desafio, gargalo e link do PDF). */
  completed: "plano-comercial-90-dias-realizado",
} as const;

export type RdConversionIdentifier = (typeof RD_CONVERSION_IDENTIFIERS)[keyof typeof RD_CONVERSION_IDENTIFIERS];

/** Nomes dos cookies do código de monitoramento da RD Station. */
export const RD_TRACKING_COOKIES = {
  /** Origem da visita, calculada pela RD (pode vir em base64) — vai em traffic_source. */
  trafficSource: "__trf.src",
  /** Id de rastreamento do visitante — vai em client_tracking_id. */
  clientTrackingId: "_rdtrk",
} as const;
