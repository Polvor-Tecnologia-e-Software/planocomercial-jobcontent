// ─── Score Engine Types ───────────────────────────────────────────────────────
// All output types produced by the deterministic score engine.
// These are NEVER sent to AI directly — a lean AIInputPayload is derived from them.

import type { DiagnosticAnswer, DiagnosticQuestion, ScoreLevel, GargaloType } from "@/types";

// ── Raw answer map (question_id → answer) ────────────────────────────────────
export type AnswerMap = Map<string, DiagnosticAnswer>;

// ── Per-question scored contribution ────────────────────────────────────────
export interface ScoredQuestion {
  question_id: string;
  pillar: "demanda" | "conversao" | "escala";
  module: string;
  weight: number;
  raw_score: number;       // 0-10 as given by the option
  weighted_score: number;  // raw_score * weight
  max_weighted: number;    // 10 * weight (max possible)
  pct_contribution: number; // 0-100: how much this Q contributed to its pillar
}

// ── Pillar detail ────────────────────────────────────────────────────────────
export interface PillarDetail {
  score: number;           // 0-100 normalised
  level: ScoreLevel;
  total_weighted: number;
  max_weighted: number;
  questions: ScoredQuestion[];
  weakest_question: ScoredQuestion | null;
  strongest_question: ScoredQuestion | null;
}

// ── Bottleneck ───────────────────────────────────────────────────────────────
export interface Bottleneck {
  type: GargaloType;
  severity: "critical" | "moderate" | "mild";
  score: number;
  gap_to_next: number;     // points behind the second-lowest pillar
  title: string;
  description: string;
  business_impact: string;
  quick_wins: string[];
}

// ── Funnel stage ────────────────────────────────────────────────────────────
export interface FunnelStage {
  id: string;
  label: string;
  estimated_monthly: number;   // estimated volume
  conversion_to_next: number;  // % conversion to next stage
  benchmark_conversion: number;// industry benchmark %
  gap_vs_benchmark: number;    // actual - benchmark (negative = underperforming)
  health: "healthy" | "warning" | "critical";
}

// ── Funnel analysis ─────────────────────────────────────────────────────────
export interface FunnelAnalysis {
  stages: FunnelStage[];
  main_leak: string;           // stage id with biggest drop vs benchmark
  estimated_lost_revenue_pct: number; // % of potential revenue being lost
  health_summary: "healthy" | "warning" | "critical";
}

// ── Maturity classification ──────────────────────────────────────────────────
export interface MaturityProfile {
  level: ScoreLevel;
  label: string;
  description: string;
  color: string;
  next_level: ScoreLevel | null;
  points_to_next: number;
  archetype: CommercialArchetype;
}

export type CommercialArchetype =
  | "founder_seller"      // solo founder selling
  | "early_team"          // small, unstructured team
  | "building_machine"    // process being built
  | "scaling_machine"     // structured, scaling
  | "performance_engine"; // full B2B machine

// ── Commercial priority ──────────────────────────────────────────────────────
export interface CommercialPriority {
  rank: number;
  pillar: "demanda" | "conversao" | "escala";
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  time_horizon: "30d" | "60d" | "90d";
  kpis: string[];
}

// ── Company profile extracted from answers ───────────────────────────────────
export interface CompanyProfile {
  commercial_stage: string;   // from m1_q1
  team_size: string;          // from m1_q2
  avg_ticket: string;         // from m1_q3
  lead_source: string;        // from m3_q1
  monthly_leads: string;      // from m3_q2
  has_icp: boolean;           // from m3_q3
  outbound_frequency: string; // from m3_q4
  conversion_rate: string;    // from m4_q1
  has_sales_process: boolean; // from m4_q2
  uses_crm: boolean;          // from m5_q1
  has_goals: boolean;         // from m2_q1
  tracks_metrics: boolean;    // from m2_q2
  knows_cac_ltv: boolean;     // from m6_q2
}

// ── Full engine output ───────────────────────────────────────────────────────
export interface ScoreEngineOutput {
  // Metadata
  computed_at: string;
  answers_count: number;
  completion_pct: number;

  // Company profile
  company_profile: CompanyProfile;

  // Scores
  scores: {
    overall: number;
    demanda: number;
    conversao: number;
    escala: number;
    level: ScoreLevel;
  };

  // Pillar details
  pillars: {
    demanda: PillarDetail;
    conversao: PillarDetail;
    escala: PillarDetail;
  };

  // Maturity
  maturity: MaturityProfile;

  // Bottlenecks (sorted by severity)
  bottlenecks: Bottleneck[];

  // Funnel
  funnel_analysis: FunnelAnalysis;

  // Recommendations
  priorities: CommercialPriority[];

  // Lean AI payload (what gets sent to OpenAI)
  ai_payload: AIPayload;
}

// ── Lean payload for AI (keeps tokens minimal) ───────────────────────────────
export interface AIPayload {
  company: {
    stage: string;
    team_size: string;
    avg_ticket: string;
    monthly_leads: string;
    conversion_rate: string;
  };
  scores: {
    overall: number;
    demanda: number;
    conversao: number;
    escala: number;
    level: string;
  };
  main_bottleneck: {
    type: string;
    severity: string;
    description: string;
  };
  top_priorities: Array<{
    pillar: string;
    title: string;
    time_horizon: string;
  }>;
  funnel: {
    main_leak: string;
    lost_revenue_pct: number;
    health: string;
  };
  archetype: string;
}
