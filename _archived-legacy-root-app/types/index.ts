// ─── Company & Lead ────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  website?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  email: string;
  phone?: string;
  role?: string;
  lgpd_consent: boolean;
  lgpd_consent_at?: string;
  lgpd_text_version?: string;
  created_at: string;
}

// ─── Diagnostic ─────────────────────────────────────────────────────────────
export type DiagnosticModule =
  | "momento_atual"
  | "meta_comercial"
  | "demanda"
  | "conversao"
  | "processo_escala"
  | "inteligencia_mercado";

export interface DiagnosticQuestion {
  id: string;
  module: DiagnosticModule;
  order: number;
  text: string;
  description?: string;
  type: "single_choice" | "multiple_choice" | "scale" | "number" | "text";
  options?: DiagnosticOption[];
  weight: number; // 1-3, importance for score
  pillar: "demanda" | "conversao" | "escala";
}

export interface DiagnosticOption {
  value: string;
  label: string;
  score: number; // 0-10 contribution
  icon?: string;
}

export interface DiagnosticAnswer {
  question_id: string;
  value: string | string[] | number;
  score: number;
}

export interface Diagnostic {
  id: string;
  lead_id: string;
  company_id: string;
  answers: DiagnosticAnswer[];
  status: "in_progress" | "completed";
  current_module: DiagnosticModule;
  current_question_index: number;
  created_at: string;
  completed_at?: string;
}

// ─── Scores ──────────────────────────────────────────────────────────────────
export interface GrowthScores {
  overall: number;       // 0-100
  demanda: number;       // 0-100
  conversao: number;     // 0-100
  escala: number;        // 0-100
  nivel: ScoreLevel;
  gargalo_principal: GargaloType;
  gargalo_description: string;
}

export type ScoreLevel =
  | "critico"      // 0-29
  | "basico"       // 30-49
  | "intermediario"// 50-69
  | "avancado"     // 70-84
  | "elite";       // 85-100

export type GargaloType =
  | "demanda"
  | "conversao"
  | "escala"
  | "processo"
  | "inteligencia";

// ─── Funnel Analysis ─────────────────────────────────────────────────────────
export interface FunnelStage {
  name: string;
  label: string;
  current: number;
  ideal: number;
  unit: string;
  conversion_rate?: number;
}

export interface FunnelAnalysis {
  id: string;
  diagnostic_id: string;
  stages: FunnelStage[];
  monthly_revenue_current: number;
  monthly_revenue_potential: number;
  created_at: string;
}

// ─── AI Report ───────────────────────────────────────────────────────────────
export interface AIReport {
  id: string;
  diagnostic_id: string;
  executive_diagnosis: string;
  plan_30_days: PlanPhase;
  plan_60_days: PlanPhase;
  plan_90_days: PlanPhase;
  content_ideas: ContentIdea[];
  rich_materials: RichMaterial[];
  email_cadences: CommercialCadence[];
  whatsapp_cadences: CommercialCadence[];
  created_at: string;
}

export interface PlanPhase {
  title: string;
  focus: string;
  actions: PlanAction[];
  expected_results: string;
  kpis: string[];
}

export interface PlanAction {
  title: string;
  description: string;
  priority: "alta" | "media" | "baixa";
  effort: "baixo" | "medio" | "alto";
  owner: string;
}

export interface ContentIdea {
  title: string;
  format: string;
  channel: string;
  objective: string;
}

export interface RichMaterial {
  title: string;
  type: string;
  description: string;
  funnel_stage: "topo" | "meio" | "fundo";
}

export interface CommercialCadence {
  name: string;
  trigger: string;
  steps: CadenceStep[];
}

export interface CadenceStep {
  day: number;
  action: string;
  message_template: string;
}

// ─── PDF Report ───────────────────────────────────────────────────────────────
export interface PDFReport {
  id: string;
  diagnostic_id: string;
  storage_path: string;
  signed_url?: string;
  signed_url_expires_at?: string;
  created_at: string;
}

// ─── RD Station Integration ──────────────────────────────────────────────────
export interface RDIntegration {
  id: string;
  lead_id: string;
  diagnostic_id: string;
  rd_contact_id?: string;
  payload: RDPayload;
  status: "pending" | "success" | "error";
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface RDPayload {
  email: string;
  name: string;
  company_name: string;
  phone?: string;
  job_title?: string;
  website?: string;
  cf_growth_score: number;
  cf_score_demanda: number;
  cf_score_conversao: number;
  cf_score_escala: number;
  cf_gargalo_principal: string;
  cf_link_plano_comercial: string;
  legal_bases: RDLegalBase[];
}

export interface RDLegalBase {
  category: "communications" | "data_processing";
  type: "consent";
  status: "granted";
}

// ─── Form Data ───────────────────────────────────────────────────────────────
export interface OnboardingFormData {
  company_name: string;
  email: string;
}

export interface ContactFormData {
  phone: string;
  website: string;
  role: string;
  lgpd_consent: boolean;
}

// ─── AI Input Payload (lean, never full Q&A) ─────────────────────────────────
export interface AIInputPayload {
  company_name: string;
  scores: GrowthScores;
  funnel: {
    current_leads: number;
    current_opportunities: number;
    current_clients: number;
    current_revenue: number;
    target_revenue: number;
  };
  bottleneck: GargaloType;
  context: {
    segment?: string;
    team_size?: string;
    sales_cycle?: string;
    avg_ticket?: string;
  };
}
