/**
 * Eventos de etapa da jornada enviados ao dataLayer do Google Tag Manager
 * (pedido explícito: um evento por etapa, com nome que identifique a
 * etapa). Lista única de nomes — nenhum outro lugar do código escreve um
 * nome de evento solto. A tabela para configurar os acionadores no GTM
 * está em docs/GTM-EVENTOS.md.
 *
 * Nunca envia dado pessoal (nome, e-mail, telefone, empresa): só a etapa,
 * o id do diagnóstico e dados da jornada (desafio, número da pergunta).
 */

export const JOURNEY_STEPS = {
  landing: { event: "etapa_01_landing", number: 1, name: "landing" },
  form: { event: "etapa_02_formulario", number: 2, name: "formulario" },
  companyData: { event: "etapa_03_dados_empresa", number: 3, name: "dados_empresa" },
  challenge: { event: "etapa_04_desafio", number: 4, name: "desafio" },
  questions: { event: "etapa_05_perguntas", number: 5, name: "perguntas" },
  question: { event: "etapa_05_pergunta", number: 5, name: "pergunta" },
  phone: { event: "etapa_06_telefone", number: 6, name: "telefone" },
  generating: { event: "etapa_07_gerando_plano", number: 7, name: "gerando_plano" },
  generationError: { event: "etapa_07_erro_geracao", number: 7, name: "erro_geracao" },
  result: { event: "etapa_08_resultado", number: 8, name: "resultado" },
} as const;

export type JourneyStepKey = keyof typeof JOURNEY_STEPS;

/** Parâmetros extras permitidos — só texto curto e número, nunca objetos. */
export type JourneyStepParams = Record<string, string | number | null | undefined>;

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

function pushToDataLayer(payload: Record<string, unknown>, params: JourneyStepParams): void {
  if (typeof window === "undefined") return;
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
  const target = window as DataLayerWindow;
  target.dataLayer = target.dataLayer ?? [];
  target.dataLayer.push({ ...payload, ...cleanParams });
}

/** Envia o evento da etapa ao dataLayer (cria o array se o GTM ainda não carregou — o GTM lê o que já estiver lá). */
export function pushJourneyStep(step: JourneyStepKey, params: JourneyStepParams = {}): void {
  const definition = JOURNEY_STEPS[step];
  pushToDataLayer(
    { event: definition.event, etapa_numero: definition.number, etapa_nome: definition.name },
    params,
  );
}

/**
 * Eventos de clique (pedido explícito: medir os botões de WhatsApp e o
 * download do PDF). Botões em Server Components são marcados com
 * data-gtm-click (ver ClickTracking); os de Client Components chamam
 * pushClickEvent direto.
 */
export const CLICK_EVENTS = {
  whatsapp: "clique_whatsapp",
  pdf: "clique_download_pdf",
  pdfReady: "download_pdf_concluido",
} as const;

export type ClickEventKey = keyof typeof CLICK_EVENTS;

export function isClickEventKey(value: string | undefined): value is ClickEventKey {
  return value !== undefined && Object.prototype.hasOwnProperty.call(CLICK_EVENTS, value);
}

/** Id do diagnóstico a partir do endereço (/diagnostico/{id}), quando houver. */
export function diagnosticIdFromPath(pathname: string): string | undefined {
  return /^\/diagnostico\/([0-9a-f-]{36})(?:\/|$)/i.exec(pathname)?.[1];
}

export function pushClickEvent(key: ClickEventKey, params: JourneyStepParams = {}): void {
  pushToDataLayer({ event: CLICK_EVENTS[key] }, params);
}
