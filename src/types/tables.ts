/**
 * Atalhos ergonômicos para os tipos de cada tabela, derivados de
 * Database (src/types/database.ts). Evita repetir
 * `Database["public"]["Tables"]["x"]["Row"]` em todo repositório.
 */
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type CompanyRow = Tables["companies"]["Row"];
export type CompanyInsert = Tables["companies"]["Insert"];
export type CompanyUpdate = Tables["companies"]["Update"];

export type LeadRow = Tables["leads"]["Row"];
export type LeadInsert = Tables["leads"]["Insert"];
export type LeadUpdate = Tables["leads"]["Update"];

export type DiagnosticRow = Tables["diagnostics"]["Row"];
export type DiagnosticInsert = Tables["diagnostics"]["Insert"];
export type DiagnosticUpdate = Tables["diagnostics"]["Update"];

export type DiagnosticAnswerRow = Tables["diagnostic_answers"]["Row"];
export type DiagnosticAnswerInsert = Tables["diagnostic_answers"]["Insert"];
export type DiagnosticAnswerUpdate = Tables["diagnostic_answers"]["Update"];

export type SiteAnalysisRow = Tables["site_analyses"]["Row"];
export type SiteAnalysisInsert = Tables["site_analyses"]["Insert"];
export type SiteAnalysisUpdate = Tables["site_analyses"]["Update"];

export type SeoAnalysisRow = Tables["seo_analyses"]["Row"];
export type SeoAnalysisInsert = Tables["seo_analyses"]["Insert"];
export type SeoAnalysisUpdate = Tables["seo_analyses"]["Update"];

export type FunnelAnalysisRow = Tables["funnel_analyses"]["Row"];
export type FunnelAnalysisInsert = Tables["funnel_analyses"]["Insert"];
export type FunnelAnalysisUpdate = Tables["funnel_analyses"]["Update"];

export type DiagnosticScoreRow = Tables["diagnostic_scores"]["Row"];
export type DiagnosticScoreInsert = Tables["diagnostic_scores"]["Insert"];

export type DiagnosticSignalRow = Tables["diagnostic_signals"]["Row"];
export type DiagnosticSignalInsert = Tables["diagnostic_signals"]["Insert"];

export type ActionLibraryRow = Tables["action_library"]["Row"];
export type ActionLibraryInsert = Tables["action_library"]["Insert"];
export type ActionLibraryUpdate = Tables["action_library"]["Update"];

export type DiagnosticActionRow = Tables["diagnostic_actions"]["Row"];
export type DiagnosticActionInsert = Tables["diagnostic_actions"]["Insert"];

export type AiReportRow = Tables["ai_reports"]["Row"];
export type AiReportInsert = Tables["ai_reports"]["Insert"];
export type AiReportUpdate = Tables["ai_reports"]["Update"];

export type PdfReportRow = Tables["pdf_reports"]["Row"];
export type PdfReportInsert = Tables["pdf_reports"]["Insert"];
export type PdfReportUpdate = Tables["pdf_reports"]["Update"];

export type RdIntegrationRow = Tables["rd_integrations"]["Row"];
export type RdIntegrationInsert = Tables["rd_integrations"]["Insert"];
export type RdIntegrationUpdate = Tables["rd_integrations"]["Update"];

export type AnalyticsEventRow = Tables["analytics_events"]["Row"];
export type AnalyticsEventInsert = Tables["analytics_events"]["Insert"];

export type {
  Dimension,
  ConfidenceLevel,
  Severity,
  Phase,
  DiagnosticStatus,
  SelectedChallenge,
  AnswerSource,
  SiteAnalysisStatus,
  SeoAnalysisStatus,
  CompanyProfileFieldSource,
  AiReportType,
  AiReportStatus,
  PdfStatus,
  RdIntegrationStatus,
} from "@/types/database";
