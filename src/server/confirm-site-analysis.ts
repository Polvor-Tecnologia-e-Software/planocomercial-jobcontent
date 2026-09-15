import "server-only";

import { analyticsEvents, companies, diagnostics, siteAnalyses } from "@/lib/database";
import type { CompanyProfileFieldSource, DiagnosticRow } from "@/types/tables";

/** Campos do perfil da empresa que a Tela 3 (confirmação) coleta. */
export type CompanyProfileFields = {
  description: string | null;
  segment: string | null;
  mainOffer: string | null;
  targetAudience: string | null;
  businessModel: string | null;
  differentiators: string[];
  commercialProofs: string[];
  conversionMechanisms: string[];
};

export type ConfirmSiteAnalysisInput = {
  diagnosticId: string;
  companyId: string;
  /** Ausente quando a pessoa segue sem site (não deveria chegar aqui, mas o tipo cobre o caso). */
  siteAnalysisId?: string | null;
  /** Se a pessoa alterou algum campo antes de confirmar (Tela 3: "Quero ajustar"). */
  edited: boolean;
  fields: CompanyProfileFields;
};

const PROFILE_FIELD_KEYS = [
  "description",
  "segment",
  "main_offer",
  "target_audience",
  "business_model",
  "differentiators",
  "commercial_proofs",
  "conversion_mechanisms",
] as const;

/**
 * Confirma (com ou sem edição do usuário) os dados extraídos da análise
 * de site, gravando-os como o perfil confirmado da empresa (seção 5.3
 * do BRD: "Somente dados confirmados podem substituir respostas
 * declaradas"). Cobre tanto "Sim, continuar" quanto "Quero ajustar" — o
 * único formulário serve para os dois; editar só muda os valores
 * enviados antes de confirmar.
 *
 * Cada campo grava sua origem em `profile_sources` ("confirmed" ou
 * "edited") para que etapas futuras que também escrevam nesses campos
 * saibam não sobrescrever silenciosamente um valor já revisado por
 * alguém.
 *
 * Mantida separada da Server Action (src/server/actions/confirm-site-analysis-action.ts)
 * de propósito: não conhece FormData nem faz redirect, o que a torna
 * simples de testar isoladamente.
 */
export async function confirmSiteAnalysis(
  input: ConfirmSiteAnalysisInput,
): Promise<DiagnosticRow> {
  const source: CompanyProfileFieldSource = input.edited ? "edited" : "confirmed";
  const profileSources = Object.fromEntries(
    PROFILE_FIELD_KEYS.map((key) => [key, source]),
  );

  await companies.updateCompany(input.companyId, {
    description: input.fields.description,
    segment: input.fields.segment,
    main_offer: input.fields.mainOffer,
    target_audience: input.fields.targetAudience,
    business_model: input.fields.businessModel,
    differentiators: input.fields.differentiators,
    commercial_proofs: input.fields.commercialProofs,
    conversion_mechanisms: input.fields.conversionMechanisms,
    profile_sources: profileSources,
  });

  if (input.siteAnalysisId) {
    await siteAnalyses.updateSiteAnalysis(input.siteAnalysisId, { status: "confirmed" });
  }

  const diagnostic = await diagnostics.updateDiagnostic(input.diagnosticId, {
    status: "company_confirmed",
  });

  await analyticsEvents.trackEvent({
    diagnostic_id: input.diagnosticId,
    event_name: "company_analysis_confirmed",
    event_data: { edited: input.edited },
  });

  return diagnostic;
}
