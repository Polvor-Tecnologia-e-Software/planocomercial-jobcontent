import "server-only";

import { analyticsEvents, companies, diagnostics, leads } from "@/lib/database";
import type { DiagnosticRow } from "@/types/tables";

/**
 * Versão do texto de consentimento LGPD mostrado perto do botão de envio
 * da Tela 2 (ver capture-form.tsx). Consentimento IMPLÍCITO: não há
 * checkbox separado — ao enviar o formulário, a pessoa já concorda com o
 * texto vigente, e este envio é o próprio ato de consentir (seção 4 do
 * BRD, decisão de produto: texto informativo em vez de opt-in explícito).
 * Suba este valor sempre que o SENTIDO do texto mudar (nunca só por
 * ajuste cosmético de redação) — cada versão enviada ao RD Station fica
 * rastreável por leads.consent_version.
 */
const LGPD_CONSENT_VERSION = "capture-form-implicit-v1";

export type StartDiagnosticInput = {
  name: string;
  companyName: string;
  /** Opcional — seção 4 do BRD: "aceitar ausência de site". */
  website?: string;
  email: string;
  /** 5 a 10 palavras-chave que resumem o negócio, usadas para as oportunidades de SEO. */
  keywords: string[];
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
};

/**
 * Primeira captura da jornada (Tela 2 do BRD): cria (ou reaproveita) a
 * empresa, cria o lead parcial (nome, e-mail e UTMs — cargo e WhatsApp
 * vêm só na captura final, seção 4) e cria o diagnóstico com status
 * "started". Registra também o evento de analytics "start_diagnostic"
 * (seção 20 do BRD).
 *
 * Mantida separada da Server Action (src/server/actions/start-diagnostic-action.ts)
 * de propósito: esta função não conhece FormData nem faz redirect, o que
 * a torna simples de testar isoladamente (ver
 * src/tests/start-diagnostic-orchestration.test.ts).
 */
export async function startDiagnostic(
  input: StartDiagnosticInput,
): Promise<DiagnosticRow> {
  const company = await companies.findOrCreateCompany({
    company_name: input.companyName,
    website: input.website ?? null,
    keywords: input.keywords,
  });

  // findOrCreateCompany não atualiza uma empresa já existente — se a
  // pessoa reinicia o diagnóstico (mesmo site), garante que as palavras-
  // chave desta nova tentativa (podem ter mudado) sejam as usadas na
  // análise de SEO, não as de uma tentativa antiga. Redundante (mas
  // inofensivo) para empresa recém-criada, que já nasce com elas.
  await companies.updateCompany(company.id, { keywords: input.keywords });

  const lead = await leads.createLead({
    company_id: company.id,
    name: input.name,
    email: input.email,
    utm_source: input.utm?.source ?? null,
    utm_medium: input.utm?.medium ?? null,
    utm_campaign: input.utm?.campaign ?? null,
    utm_content: input.utm?.content ?? null,
    utm_term: input.utm?.term ?? null,
  });

  // Consentimento LGPD (implícito, ver LGPD_CONSENT_VERSION acima) — sem
  // isso, leads.consent_given fica false e sendRdStationConversion() nunca
  // envia a conversão (ver src/server/send-rd-station-conversion.ts).
  await leads.recordConsent(lead.id, LGPD_CONSENT_VERSION);

  const diagnostic = await diagnostics.createDiagnostic({
    company_id: company.id,
    lead_id: lead.id,
    status: "started",
  });

  await analyticsEvents.trackEvent({
    diagnostic_id: diagnostic.id,
    event_name: "start_diagnostic",
    event_data: {
      has_website: Boolean(input.website),
      utm_source: input.utm?.source ?? null,
      utm_medium: input.utm?.medium ?? null,
      utm_campaign: input.utm?.campaign ?? null,
    },
  });

  return diagnostic;
}
