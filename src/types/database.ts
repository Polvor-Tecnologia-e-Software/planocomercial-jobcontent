/**
 * Tipos do banco de dados Supabase.
 *
 * Gerado manualmente a partir das migrations em supabase/migrations,
 * pois este ambiente de desenvolvimento não tem um projeto Supabase
 * real conectado (não há como rodar `supabase gen types` contra um
 * banco vivo). O schema abaixo foi conferido rodando as migrations em
 * um Postgres local e validando manualmente cada tabela.
 *
 * Assim que o projeto Supabase real existir, regenere este arquivo com:
 *
 *   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
 *
 * e confira se nada divergiu (o time deve tratar o resultado do CLI como
 * fonte de verdade a partir desse momento).
 */

// ------------------------------------------------------------------------------
// Vocabulários fixos (espelham os CHECK constraints das migrations)
// ------------------------------------------------------------------------------

export type Dimension =
  "demand" | "conversion" | "processes" | "management" | "scale" | "digital_positioning";

export type ConfidenceLevel = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high";
export type Phase = "days_1_30" | "days_31_60" | "days_61_90";

export type DiagnosticStatus =
  | "started"
  | "company_analyzing"
  | "company_confirmed"
  | "challenge_selected"
  | "goal_defined"
  | "adaptive_in_progress"
  | "prediagnosis_ready"
  | "lead_captured"
  | "generating"
  | "completed"
  | "failed";

export type SelectedChallenge = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export type AnswerSource = "user" | "site_confirmed" | "site_inference" | "calculated";

export type SiteAnalysisStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "confirmed"
  | "rejected"
  // A pessoa optou por não usar uma análise que teve sucesso — diferente
  // de "rejected" (a análise saiu errada). Ver seção 5.3 do BRD.
  | "skipped";

/** Origem de cada campo confirmado do perfil da empresa (companies.profile_sources). */
export type CompanyProfileFieldSource = "confirmed" | "edited";

export type SeoAnalysisStatus = "not_started" | "queued" | "processing" | "completed" | "failed" | "skipped";

export type AiReportType =
  "site_analysis" | "prediagnosis" | "diagnostic_plan" | "partial_regeneration";

export type AiReportStatus =
  "queued" | "generating" | "validated" | "failed" | "retrying";

export type PdfStatus = "queued" | "generating" | "stored" | "available" | "failed";

export type RdIntegrationStatus = "pending" | "sent" | "failed" | "retrying";

// ------------------------------------------------------------------------------
// Database
// ------------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          company_name: string;
          website: string | null;
          normalized_website: string | null;
          segment: string | null;
          description: string | null;
          main_offer: string | null;
          target_audience: string | null;
          business_model: string | null;
          average_ticket: number | null;
          sales_cycle: string | null;
          // jsonb: array de strings. Tipado como "unknown" (mesma
          // convenção usada em outras colunas jsonb deste arquivo, ex.
          // site_analyses.pages) — a validação de formato fica na
          // camada de aplicação.
          keywords: unknown;
          differentiators: unknown;
          commercial_proofs: unknown;
          conversion_mechanisms: unknown;
          // jsonb: mapa {campo: "confirmed" | "edited"}.
          profile_sources: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          website?: string | null;
          // normalized_website é calculada por trigger; não deve ser enviada.
          segment?: string | null;
          description?: string | null;
          main_offer?: string | null;
          target_audience?: string | null;
          business_model?: string | null;
          average_ticket?: number | null;
          sales_cycle?: string | null;
          keywords?: unknown;
          differentiators?: unknown;
          commercial_proofs?: unknown;
          conversion_mechanisms?: unknown;
          profile_sources?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };

      leads: {
        Row: {
          id: string;
          company_id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          consent_given: boolean;
          consent_version: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          consent_given?: boolean;
          consent_version?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };

      diagnostics: {
        Row: {
          id: string;
          company_id: string;
          lead_id: string | null;
          status: DiagnosticStatus;
          selected_challenge: SelectedChallenge | null;
          current_step: string | null;
          overall_score: number | null;
          maturity_stage: string | null;
          primary_bottleneck: Dimension | null;
          secondary_risk: Dimension | null;
          data_quality_percentage: number | null;
          confidence_level: ConfidenceLevel | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          lead_id?: string | null;
          status?: DiagnosticStatus;
          selected_challenge?: SelectedChallenge | null;
          current_step?: string | null;
          overall_score?: number | null;
          maturity_stage?: string | null;
          primary_bottleneck?: Dimension | null;
          secondary_risk?: Dimension | null;
          data_quality_percentage?: number | null;
          confidence_level?: ConfidenceLevel | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostics"]["Insert"]>;
        Relationships: [];
      };

      diagnostic_answers: {
        Row: {
          id: string;
          diagnostic_id: string;
          question_key: string;
          answer_value: unknown;
          answer_source: AnswerSource;
          confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          question_key: string;
          answer_value: unknown;
          answer_source?: AnswerSource;
          confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostic_answers"]["Insert"]>;
        Relationships: [];
      };

      site_analyses: {
        Row: {
          id: string;
          diagnostic_id: string;
          normalized_url: string | null;
          status: SiteAnalysisStatus;
          content_hash: string | null;
          result_json: unknown;
          pages: unknown;
          warnings: unknown;
          model: string | null;
          prompt_version: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          confidence: ConfidenceLevel | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          normalized_url?: string | null;
          status?: SiteAnalysisStatus;
          content_hash?: string | null;
          result_json?: unknown;
          pages?: unknown;
          warnings?: unknown;
          model?: string | null;
          prompt_version?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          confidence?: ConfidenceLevel | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_analyses"]["Insert"]>;
        Relationships: [];
      };

      seo_analyses: {
        Row: {
          id: string;
          diagnostic_id: string;
          status: SeoAnalysisStatus;
          content_hash: string | null;
          keyword_ideas: unknown;
          warnings: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          status?: SeoAnalysisStatus;
          content_hash?: string | null;
          keyword_ideas?: unknown;
          warnings?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seo_analyses"]["Insert"]>;
        Relationships: [];
      };

      funnel_analyses: {
        Row: {
          id: string;
          diagnostic_id: string;
          current_funnel: unknown;
          required_funnel: unknown;
          conversion_rates: unknown;
          gaps: unknown;
          assumptions: unknown;
          missing_data: unknown;
          completeness_percentage: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          current_funnel?: unknown;
          required_funnel?: unknown;
          conversion_rates?: unknown;
          gaps?: unknown;
          assumptions?: unknown;
          missing_data?: unknown;
          completeness_percentage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funnel_analyses"]["Insert"]>;
        Relationships: [];
      };

      diagnostic_scores: {
        Row: {
          id: string;
          diagnostic_id: string;
          dimension: Dimension;
          score: number;
          weight: number;
          evidence: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          dimension: Dimension;
          score: number;
          weight: number;
          evidence?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostic_scores"]["Insert"]>;
        Relationships: [];
      };

      diagnostic_signals: {
        Row: {
          id: string;
          diagnostic_id: string;
          signal_code: string;
          dimension: Dimension | null;
          severity: Severity;
          evidence: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          signal_code: string;
          dimension?: Dimension | null;
          severity?: Severity;
          evidence?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostic_signals"]["Insert"]>;
        Relationships: [];
      };

      action_library: {
        Row: {
          id: string;
          action_code: string;
          title: string;
          description: string | null;
          dimension: Dimension;
          bottleneck_type: string | null;
          funnel_stage: string | null;
          default_phase: Phase;
          default_owner: string;
          default_indicator: string | null;
          completion_criteria: string | null;
          dependencies: unknown;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action_code: string;
          title: string;
          description?: string | null;
          dimension: Dimension;
          bottleneck_type?: string | null;
          funnel_stage?: string | null;
          default_phase: Phase;
          default_owner: string;
          default_indicator?: string | null;
          completion_criteria?: string | null;
          dependencies?: unknown;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["action_library"]["Insert"]>;
        Relationships: [];
      };

      diagnostic_actions: {
        Row: {
          id: string;
          diagnostic_id: string;
          action_library_id: string;
          phase: Phase;
          priority_order: number;
          custom_context: string | null;
          generated_content: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          action_library_id: string;
          phase: Phase;
          priority_order: number;
          custom_context?: string | null;
          generated_content?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diagnostic_actions"]["Insert"]>;
        Relationships: [];
      };

      ai_reports: {
        Row: {
          id: string;
          diagnostic_id: string;
          report_type: AiReportType;
          status: AiReportStatus;
          model: string | null;
          prompt_version: string | null;
          input_hash: string | null;
          response_json: unknown;
          input_tokens: number | null;
          output_tokens: number | null;
          estimated_cost: number | null;
          latency_ms: number | null;
          cached: boolean;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          report_type: AiReportType;
          status?: AiReportStatus;
          model?: string | null;
          prompt_version?: string | null;
          input_hash?: string | null;
          response_json?: unknown;
          input_tokens?: number | null;
          output_tokens?: number | null;
          estimated_cost?: number | null;
          latency_ms?: number | null;
          cached?: boolean;
          last_error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_reports"]["Insert"]>;
        Relationships: [];
      };

      pdf_reports: {
        Row: {
          id: string;
          diagnostic_id: string;
          storage_path: string;
          report_hash: string | null;
          template_version: string | null;
          file_hash: string | null;
          file_size: number | null;
          version: number;
          status: PdfStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          storage_path: string;
          report_hash?: string | null;
          template_version?: string | null;
          file_hash?: string | null;
          file_size?: number | null;
          version?: number;
          status?: PdfStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pdf_reports"]["Insert"]>;
        Relationships: [];
      };

      rd_integrations: {
        Row: {
          id: string;
          diagnostic_id: string;
          lead_id: string | null;
          event_name: string;
          payload: unknown;
          status: RdIntegrationStatus;
          attempts: number;
          last_error: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          lead_id?: string | null;
          event_name: string;
          payload?: unknown;
          status?: RdIntegrationStatus;
          attempts?: number;
          last_error?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rd_integrations"]["Insert"]>;
        Relationships: [];
      };

      analytics_events: {
        Row: {
          id: string;
          diagnostic_id: string;
          event_name: string;
          event_data: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          diagnostic_id: string;
          event_name: string;
          event_data?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
        Relationships: [];
      };

      /** Suporte ao rate limiting (src/lib/security/rate-limit.ts). */
      rate_limits: {
        Row: {
          key: string;
          window_start: string;
          count: number;
        };
        Insert: {
          key: string;
          window_start: string;
          count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limits"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** Incrementa (ou inicia) atomicamente uma janela de rate_limits e devolve o novo total. */
      increment_rate_limit: {
        Args: { p_key: string; p_window_start: string };
        Returns: number;
      };
    };
  };
};
