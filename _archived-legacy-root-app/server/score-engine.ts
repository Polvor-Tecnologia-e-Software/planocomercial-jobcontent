/**
 * server/score-engine.ts
 *
 * Thin adapter: re-exports from the real engine in /services/score-engine
 * and provides the legacy GrowthScores shape used by existing pages.
 * All actual logic lives in /services/score-engine/*.
 */

import type {
  DiagnosticAnswer,
  DiagnosticQuestion,
  GrowthScores,
  ScoreLevel,
} from "@/types";
import { runScoreEngine } from "@/services/score-engine";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";

// ─── Legacy adapter (used by /app/results/page.tsx) ──────────────────────────
export function calculateGrowthScores(
  answers: DiagnosticAnswer[],
  questions: DiagnosticQuestion[] = DIAGNOSTIC_QUESTIONS
): GrowthScores {
  const output = runScoreEngine(answers, questions);

  return {
    overall:              output.scores.overall,
    demanda:              output.scores.demanda,
    conversao:            output.scores.conversao,
    escala:               output.scores.escala,
    nivel:                output.scores.level,
    gargalo_principal:    output.bottlenecks[0].type as GrowthScores["gargalo_principal"],
    gargalo_description:  output.bottlenecks[0].description,
  };
}

// ─── Score level display metadata ─────────────────────────────────────────────
export const SCORE_LEVELS: Record<
  ScoreLevel,
  { label: string; color: string; description: string }
> = {
  critico: {
    label:       "Crítico",
    color:       "#ef4444",
    description: "Máquina comercial com sérios gargalos. Ação imediata necessária.",
  },
  basico: {
    label:       "Básico",
    color:       "#f59e0b",
    description: "Fundação existe, mas precisa de estruturação urgente.",
  },
  intermediario: {
    label:       "Intermediário",
    color:       "#3b82f6",
    description: "Processo em desenvolvimento. Grande potencial de crescimento.",
  },
  avancado: {
    label:       "Avançado",
    color:       "#10b981",
    description: "Máquina comercial sólida. Foco em otimização e escala.",
  },
  elite: {
    label:       "Elite",
    color:       "#0ea5e9",
    description: "Operação comercial de alta performance. Benchmark do setor.",
  },
};

// ─── Re-export the full engine for API routes ─────────────────────────────────
export { runScoreEngine } from "@/services/score-engine";
export type { ScoreEngineOutput } from "@/services/score-engine";
