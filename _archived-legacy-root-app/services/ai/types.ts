/**
 * /services/ai/types.ts
 *
 * All types for the AI service layer.
 * The raw JSON the model returns is parsed into GrowthPlanRaw,
 * then validated/coerced into GrowthPlan (the safe, typed version).
 */

import type { AIPayload } from "@/services/score-engine/types";

// ─── Input to AI service ──────────────────────────────────────────────────────
export interface GeneratePlanInput {
  company_name: string;         // used in prompt personalisation
  ai_payload: AIPayload;        // the lean JSON from Score Engine
  diagnostic_id?: string;       // Supabase row id (optional, for persistence)
  idempotency_key?: string;     // prevents duplicate generations
}

// ─── Streaming event shapes ───────────────────────────────────────────────────
export type StreamEvent =
  | { type: "status";   message: string }
  | { type: "progress"; pct: number }
  | { type: "chunk";    text: string }
  | { type: "done";     plan: GrowthPlan }
  | { type: "error";    message: string; code: AIErrorCode };

export type AIErrorCode =
  | "OPENAI_TIMEOUT"
  | "OPENAI_RATE_LIMIT"
  | "OPENAI_API_ERROR"
  | "INVALID_RESPONSE"
  | "PROMPT_INJECTION"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

// ─── Raw model output (untrusted) ────────────────────────────────────────────
// What the model _claims_ to return. Validated before use.
export interface GrowthPlanRaw {
  diagnostico?: unknown;
  plano30dias?: unknown;
  plano60dias?: unknown;
  plano90dias?: unknown;
  conteudos?: unknown;
  materiaisRicos?: unknown;
  cadenciaEmail?: unknown;
  cadenciaWhatsapp?: unknown;
  [key: string]: unknown; // allow extra keys to not crash on extra fields
}

// ─── Safe typed plan (post-validation) ───────────────────────────────────────
export interface GrowthPlan {
  diagnostico: string;
  plano30dias: PlanItem[];
  plano60dias: PlanItem[];
  plano90dias: PlanItem[];
  conteudos: ContentItem[];
  materiaisRicos: RichMaterialItem[];
  cadenciaEmail: CadenceItem[];
  cadenciaWhatsapp: CadenceItem[];
}

export interface PlanItem {
  titulo: string;
  descricao: string;
  prioridade: "alta" | "media" | "baixa";
  esforco: "baixo" | "medio" | "alto";
  responsavel: string;
  kpis: string[];
}

export interface ContentItem {
  titulo: string;
  formato: string;
  canal: string;
  objetivo: string;
}

export interface RichMaterialItem {
  titulo: string;
  tipo: string;
  descricao: string;
  etapa_funil: "topo" | "meio" | "fundo";
}

export interface CadenceStep {
  dia: number;
  acao: string;
  mensagem: string;
}

export interface CadenceItem {
  nome: string;
  gatilho: string;
  passos: CadenceStep[];
}

// ─── Persistence result ───────────────────────────────────────────────────────
export interface PersistResult {
  id: string;
  persisted: boolean;
  mocked: boolean;      // true when Supabase is not configured
  error?: string;
}

// ─── Full generation result ───────────────────────────────────────────────────
export interface GeneratePlanResult {
  plan: GrowthPlan;
  persist_result: PersistResult;
  meta: {
    model: string;
    tokens_input: number;
    tokens_output: number;
    duration_ms: number;
    cost_usd: number;
  };
}
