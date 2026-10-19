import "server-only";

import type { RdConversionIdentifier } from "@/lib/rd-station/config";
import { RD_CUSTOM_FIELDS, RD_NATIVE_FIELDS, RD_QUIZ_FIELDS } from "@/lib/rd-station/field-map";
import type { RdQuizAnswers } from "@/lib/rd-station/quiz-answers";

/** Nenhum campo de texto enviado ao RD Station passa disso — proteção simples contra payload injection/campos gigantes (seção 16). */
const MAX_FIELD_LENGTH = 300;
/** Exceção: o texto com todas as respostas do quiz (cf_respostas_quiz) — ~14 perguntas com o enunciado completo. */
const MAX_SUMMARY_LENGTH = 5000;
/** Resposta de uma pergunta do quiz — o mesmo teto do campo de texto da jornada. */
const MAX_QUIZ_ANSWER_LENGTH = 2000;

export type RdStationLeadInput = {
  email: string;
  name: string | null;
  personalPhone: string | null;
  mobilePhone: string | null;
  jobTitle: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  /** Cookie __trf.src da RD, quando o código de monitoramento estava no site. */
  rdTrafficSource: string | null;
  /** Cookie _rdtrk da RD. */
  rdClientTrackingId: string | null;
};

export type RdStationCompanyInput = {
  companyName: string;
  website: string | null;
  segment: string | null;
};

export type RdStationDiagnosticInput = {
  diagnosticId: string;
  challengeLabel: string | null;
  primaryBottleneckLabel: string | null;
  confidenceLevel: string | null;
};

export type BuildRdStationConversionPayloadInput = {
  conversionIdentifier: RdConversionIdentifier;
  lead: RdStationLeadInput;
  company: RdStationCompanyInput;
  diagnostic: RdStationDiagnosticInput;
  /** Link público da tela do diagnóstico desta pessoa (vai em cf_link_plano_comercial). */
  planLink: string | null;
  /** Respostas do quiz — só na conversão final (plano realizado); null na de captura. */
  quizAnswers: RdQuizAnswers | null;
};

/**
 * Payload autorizado enviado ao RD Station. `conversion_identifier` e
 * `email` são sempre os únicos campos garantidos — todo o resto
 * (contato, tráfego, campos personalizados) só aparece quando o dado
 * correspondente existe de verdade, nunca como string vazia ou "null".
 */
export type RdStationConversionPayload = {
  conversion_identifier: string;
  email: string;
} & Partial<Record<string, string | number>>;

function clean(value: string | null | undefined, maxLength = MAX_FIELD_LENGTH): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  return trimmed.slice(0, maxLength);
}

const ALLOWED_QUIZ_FIELDS = new Set(Object.values(RD_QUIZ_FIELDS));

/**
 * Telefone no padrão exigido pela RD (+55DDDNÚMERO, ex.: +5511999998888)
 * — o lead guarda como foi digitado, com máscara: "(44) 99709-3737".
 * 10/11 dígitos = DDD + número brasileiro; 12/13 começando com 55 = já tem
 * o código do país. Qualquer outro formato vai como veio (nunca descarta).
 */
export function toRdPhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return `+${digits}`;
  return value;
}

/**
 * Monta o payload de Conversão a partir apenas de dados já persistidos e
 * autorizados (lead, empresa, diagnóstico, link do PDF) — nunca aceita
 * texto livre arbitrário de fora dessas estruturas tipadas, então não há
 * como um chamador injetar um campo não previsto aqui. Cada campo é
 * omitido (não enviado como vazio) quando o dado correspondente não
 * existe — ver seção 3/4/5 do pedido desta etapa.
 */
export function buildRdStationConversionPayload(
  input: BuildRdStationConversionPayloadInput,
): RdStationConversionPayload {
  const { conversionIdentifier, lead, company, diagnostic, planLink, quizAnswers } = input;

  const payload: RdStationConversionPayload = {
    conversion_identifier: conversionIdentifier,
    email: lead.email,
  };

  const name = clean(lead.name);
  if (name) payload[RD_NATIVE_FIELDS.name] = name;

  const personalPhone = toRdPhone(clean(lead.personalPhone));
  if (personalPhone) payload[RD_NATIVE_FIELDS.personalPhone] = personalPhone;

  const mobilePhone = toRdPhone(clean(lead.mobilePhone));
  if (mobilePhone) payload[RD_NATIVE_FIELDS.mobilePhone] = mobilePhone;

  const jobTitle = clean(lead.jobTitle);
  if (jobTitle) payload[RD_NATIVE_FIELDS.jobTitle] = jobTitle;

  payload[RD_NATIVE_FIELDS.companyName] = clean(company.companyName) ?? company.companyName;

  const website = clean(company.website);
  if (website) payload[RD_NATIVE_FIELDS.website] = website;

  // Origem da conversão (https://developers.rdstation.com/reference/conversao):
  // com o cookie __trf.src, a RD classifica a origem sozinha (orgânico,
  // direto, referência, social, campanha) — e nesse caso traffic_medium,
  // traffic_campaign e traffic_value PRECISAM ir vazios. Sem o cookie
  // (código de monitoramento da RD ausente no site), cai nos UTMs da URL.
  const rdTrafficSource = clean(lead.rdTrafficSource);
  if (rdTrafficSource) {
    payload[RD_NATIVE_FIELDS.trafficSource] = rdTrafficSource;
  } else {
    // UTMs: nomes nativos do RD Station não são "utm_*" (ver field-map.ts).
    const trafficSource = clean(lead.utmSource);
    if (trafficSource) payload[RD_NATIVE_FIELDS.trafficSource] = trafficSource;

    const trafficMedium = clean(lead.utmMedium);
    if (trafficMedium) payload[RD_NATIVE_FIELDS.trafficMedium] = trafficMedium;

    const trafficCampaign = clean(lead.utmCampaign);
    if (trafficCampaign) payload[RD_NATIVE_FIELDS.trafficCampaign] = trafficCampaign;

    const trafficValue = clean(lead.utmTerm);
    if (trafficValue) payload[RD_NATIVE_FIELDS.trafficValue] = trafficValue;
  }

  const clientTrackingId = clean(lead.rdClientTrackingId);
  if (clientTrackingId) payload[RD_NATIVE_FIELDS.clientTrackingId] = clientTrackingId;

  // utm_content não tem campo nativo no endpoint de Conversão.
  const utmContent = clean(lead.utmContent);
  if (utmContent) payload[RD_CUSTOM_FIELDS.utmContent] = utmContent;

  // Dados comerciais do diagnóstico — sempre como campos personalizados.
  payload[RD_CUSTOM_FIELDS.diagnosticId] = diagnostic.diagnosticId;

  const challenge = clean(diagnostic.challengeLabel);
  if (challenge) payload[RD_CUSTOM_FIELDS.challenge] = challenge;

  const primaryBottleneck = clean(diagnostic.primaryBottleneckLabel);
  if (primaryBottleneck) payload[RD_CUSTOM_FIELDS.primaryBottleneck] = primaryBottleneck;

  const confidenceLevel = clean(diagnostic.confidenceLevel);
  if (confidenceLevel) payload[RD_CUSTOM_FIELDS.confidenceLevel] = confidenceLevel;

  const segment = clean(company.segment);
  if (segment) payload[RD_CUSTOM_FIELDS.segment] = segment;

  const link = clean(planLink);
  if (link) payload[RD_CUSTOM_FIELDS.planLink] = link;

  if (quizAnswers) {
    // Só os campos do mapa centralizado — nunca uma chave arbitrária.
    for (const [field, value] of Object.entries(quizAnswers.fields)) {
      // Respostas abertas (texto livre) podem passar de 300 caracteres — mesmo limite da tela (2.000).
      const answer = clean(value, MAX_QUIZ_ANSWER_LENGTH);
      if (answer && ALLOWED_QUIZ_FIELDS.has(field)) payload[field] = answer;
    }
    const summary = clean(quizAnswers.summary, MAX_SUMMARY_LENGTH);
    if (summary) payload[RD_CUSTOM_FIELDS.quizAnswersSummary] = summary;
  }

  return payload;
}
