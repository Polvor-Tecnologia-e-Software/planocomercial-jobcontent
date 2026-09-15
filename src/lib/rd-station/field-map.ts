import "server-only";

/**
 * Nomes de campo do endpoint de Conversão (RD Station Marketing — CDP),
 * conferidos em https://developers.rdstation.com/reference/conversao antes
 * de escrever este arquivo. Únicos usados em todo o payload — nunca repita
 * um nome de campo do RD Station em outro lugar do código.
 */

/**
 * Campos nativos de contato/tráfego — nomes exatamente como documentados
 * pelo RD Station (não são os nomes usuais de UTM: o RD usa
 * "traffic_source/medium/campaign/value", não "utm_source/medium/campaign/term").
 */
export const RD_NATIVE_FIELDS = {
  conversionIdentifier: "conversion_identifier",
  email: "email",
  name: "name",
  personalPhone: "personal_phone",
  mobilePhone: "mobile_phone",
  jobTitle: "job_title",
  companyName: "company_name",
  website: "website",
  trafficSource: "traffic_source",
  trafficMedium: "traffic_medium",
  trafficCampaign: "traffic_campaign",
  /** Não existe "traffic_term" documentado — o RD usa "traffic_value" para o equivalente de UTM term. */
  trafficValue: "traffic_value",
} as const;

/**
 * Campos personalizados (prefixo cf_, exigido pelo RD Station). Precisam
 * existir no RD Station ANTES de o envio funcionar de verdade — ver
 * docs/CHECKLIST-RD-STATION.md para os nomes e como criá-los no painel.
 */
export const RD_CUSTOM_FIELDS = {
  /** Não existe campo nativo para utm_content no endpoint de Conversão — só traffic_source/medium/campaign/value. */
  utmContent: "cf_utm_content",
  diagnosticId: "cf_diagnostico_id",
  challenge: "cf_desafio_principal",
  primaryBottleneck: "cf_gargalo_principal",
  confidenceLevel: "cf_nivel_confianca",
  segment: "cf_segmento_empresa",
  pdfLink: "cf_link_plano_comercial",
} as const;
