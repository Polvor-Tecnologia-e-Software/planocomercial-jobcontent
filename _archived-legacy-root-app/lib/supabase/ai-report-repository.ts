/**
 * /lib/supabase/ai-report-repository.ts
 *
 * Persists AI-generated plans to Supabase.
 * Gracefully mocks when Supabase is not configured (dev / demo mode).
 * Never throws — always returns PersistResult.
 */

import type { GrowthPlan, PersistResult } from "@/services/ai/types";

interface PersistOptions {
  diagnostic_id?: string;
  company_name: string;
  email?: string;
  scores: {
    overall: number;
    demanda: number;
    conversao: number;
    escala: number;
    level: string;
  };
  bottleneck_type: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  model: string;
  duration_ms: number;
}

// ─── Check if Supabase is configured ──────────────────────────────────────────
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("placeholder") &&
    key.length > 20 &&
    !key.includes("placeholder")
  );
}

// ─── Mock persist (no Supabase) ───────────────────────────────────────────────
function mockPersist(): PersistResult {
  return {
    id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    persisted: false,
    mocked: true,
  };
}

// ─── Real Supabase persist ────────────────────────────────────────────────────
async function supabasePersist(
  plan: GrowthPlan,
  opts: PersistOptions
): Promise<PersistResult> {
  // Dynamic import so the module doesn't error when Supabase is unconfigured
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("ai_reports")
    .insert({
      diagnostic_id:      opts.diagnostic_id ?? null,
      growth_score:       opts.scores.overall,
      score_demanda:      opts.scores.demanda,
      score_conversao:    opts.scores.conversao,
      score_escala:       opts.scores.escala,
      score_nivel:        opts.scores.level,
      gargalo_principal:  opts.bottleneck_type,
      executive_diagnosis: plan.diagnostico,
      plan_30_days: {
        title: "Plano 30 dias",
        focus: plan.plano30dias[0]?.titulo ?? "",
        actions: plan.plano30dias.map((a) => ({
          title:       a.titulo,
          description: a.descricao,
          priority:    a.prioridade,
          effort:      a.esforco,
          owner:       a.responsavel,
        })),
        expected_results: "",
        kpis: plan.plano30dias.flatMap((a) => a.kpis),
      },
      plan_60_days: {
        title: "Plano 60 dias",
        focus: plan.plano60dias[0]?.titulo ?? "",
        actions: plan.plano60dias.map((a) => ({
          title:       a.titulo,
          description: a.descricao,
          priority:    a.prioridade,
          effort:      a.esforco,
          owner:       a.responsavel,
        })),
        expected_results: "",
        kpis: plan.plano60dias.flatMap((a) => a.kpis),
      },
      plan_90_days: {
        title: "Plano 90 dias",
        focus: plan.plano90dias[0]?.titulo ?? "",
        actions: plan.plano90dias.map((a) => ({
          title:       a.titulo,
          description: a.descricao,
          priority:    a.prioridade,
          effort:      a.esforco,
          owner:       a.responsavel,
        })),
        expected_results: "",
        kpis: plan.plano90dias.flatMap((a) => a.kpis),
      },
      content_ideas:      plan.conteudos,
      rich_materials:     plan.materiaisRicos,
      email_cadences:     plan.cadenciaEmail,
      whatsapp_cadences:  plan.cadenciaWhatsapp,
      model_used:         opts.model,
      tokens_input:       opts.tokens_input,
      tokens_output:      opts.tokens_output,
      cost_usd:           opts.cost_usd,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ai-report-repository] Supabase insert error:", error);
    return {
      id: "persist_failed",
      persisted: false,
      mocked: false,
      error: error.message,
    };
  }

  return {
    id: data.id,
    persisted: true,
    mocked: false,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function persistAIReport(
  plan: GrowthPlan,
  opts: PersistOptions
): Promise<PersistResult> {
  if (!isSupabaseConfigured()) {
    console.log("[ai-report-repository] Supabase not configured — using mock persist");
    return mockPersist();
  }

  try {
    return await supabasePersist(plan, opts);
  } catch (err) {
    console.error("[ai-report-repository] Unexpected error:", err);
    return {
      id: "persist_error",
      persisted: false,
      mocked: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
