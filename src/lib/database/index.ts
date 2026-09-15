import "server-only";

/**
 * Ponto único de importação dos repositórios de acesso a dados.
 * Reexportados como namespaces (em vez de "export *") porque vários
 * módulos têm funções com nomes parecidos (ex.: createX, getXById) —
 * importar como namespace evita colisão e deixa claro, no código que
 * consome, a qual tabela cada chamada se refere.
 *
 * Uso típico:
 *
 *   import { companies, diagnostics } from "@/lib/database";
 *   const company = await companies.findOrCreateCompany({ company_name });
 *   const diagnostic = await diagnostics.createDiagnostic({ company_id: company.id });
 */
export * as companies from "@/lib/database/companies";
export * as leads from "@/lib/database/leads";
export * as diagnostics from "@/lib/database/diagnostics";
export * as diagnosticAnswers from "@/lib/database/diagnostic-answers";
export * as siteAnalyses from "@/lib/database/site-analyses";
export * as seoAnalyses from "@/lib/database/seo-analyses";
export * as funnelAnalyses from "@/lib/database/funnel-analyses";
export * as diagnosticScores from "@/lib/database/diagnostic-scores";
export * as diagnosticSignals from "@/lib/database/diagnostic-signals";
export * as actionLibrary from "@/lib/database/action-library";
export * as diagnosticActions from "@/lib/database/diagnostic-actions";
export * as aiReports from "@/lib/database/ai-reports";
export * as pdfReports from "@/lib/database/pdf-reports";
export * as rdIntegrations from "@/lib/database/rd-integrations";
export * as analyticsEvents from "@/lib/database/analytics-events";

export { DatabaseError } from "@/lib/database/errors";
