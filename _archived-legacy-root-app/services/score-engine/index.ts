/**
 * Growth Planner B2B™ — Score Engine
 *
 * Deterministic, server-side engine. NO AI involved.
 * Runs in ~1ms, fully testable, produces a structured ScoreEngineOutput
 * that feeds both the UI and (as a lean payload) the AI report generator.
 */

import type { DiagnosticAnswer, DiagnosticQuestion } from "@/types";
import type { ScoreEngineOutput, AIPayload } from "./types";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import {
  scoreAllPillars,
  calculateOverall,
  classifyScore,
  buildAnswerMap,
} from "./calculator";
import { identifyBottlenecks, extractCriticalSignals } from "./bottleneck-analyzer";
import { analyzeFunnel, extractFunnelContext } from "./funnel-analyzer";
import {
  buildCompanyProfile,
  buildMaturityProfile,
  generatePriorities,
} from "./profile-builder";

// ─── Main engine entry point ──────────────────────────────────────────────────
export function runScoreEngine(
  answers: DiagnosticAnswer[],
  questions: DiagnosticQuestion[] = DIAGNOSTIC_QUESTIONS
): ScoreEngineOutput {
  const answeredCount = answers.length;
  const completionPct = Math.round((answeredCount / questions.length) * 100);

  // 1. Build lookup map
  const answerMap = buildAnswerMap(answers);

  // 2. Score all three pillars
  const pillars = scoreAllPillars(answers, questions);

  // 3. Calculate overall weighted score
  const overall = calculateOverall(
    pillars.demanda.score,
    pillars.conversao.score,
    pillars.escala.score
  );

  // 4. Classify overall level
  const level = classifyScore(overall);

  // 5. Identify and rank bottlenecks
  const bottlenecks = identifyBottlenecks(
    pillars.demanda.score,
    pillars.conversao.score,
    pillars.escala.score
  );

  // 6. Extract company profile from answers
  const companyProfile = buildCompanyProfile(answers);

  // 7. Build maturity profile
  const maturity = buildMaturityProfile(overall, level, companyProfile);

  // 8. Analyze funnel
  const funnelAnalysis = analyzeFunnel(answers, answerMap);

  // 9. Generate priorities
  const priorities = generatePriorities(bottlenecks, companyProfile, overall);

  // 10. Build lean AI payload (never raw Q&A)
  const aiPayload = buildAIPayload({
    overall,
    level,
    pillars,
    bottlenecks,
    funnelAnalysis,
    companyProfile,
    maturity,
    priorities,
  });

  return {
    computed_at: new Date().toISOString(),
    answers_count: answeredCount,
    completion_pct: completionPct,
    company_profile: companyProfile,
    scores: {
      overall,
      demanda:   pillars.demanda.score,
      conversao: pillars.conversao.score,
      escala:    pillars.escala.score,
      level,
    },
    pillars,
    maturity,
    bottlenecks,
    funnel_analysis: funnelAnalysis,
    priorities,
    ai_payload: aiPayload,
  };
}

// ─── Build lean AI payload ────────────────────────────────────────────────────
// This is what gets sent to OpenAI — never the full answers.
// Keeps input tokens ~600-800 regardless of how many questions there are.
function buildAIPayload(ctx: {
  overall: number;
  level: ReturnType<typeof classifyScore>;
  pillars: ReturnType<typeof scoreAllPillars>;
  bottlenecks: ReturnType<typeof identifyBottlenecks>;
  funnelAnalysis: ReturnType<typeof analyzeFunnel>;
  companyProfile: ReturnType<typeof buildCompanyProfile>;
  maturity: ReturnType<typeof buildMaturityProfile>;
  priorities: ReturnType<typeof generatePriorities>;
}): AIPayload {
  const { overall, level, pillars, bottlenecks, funnelAnalysis, companyProfile, maturity, priorities } = ctx;
  const [main] = bottlenecks;

  return {
    company: {
      stage:           companyProfile.commercial_stage,
      team_size:       companyProfile.team_size,
      avg_ticket:      companyProfile.avg_ticket,
      monthly_leads:   companyProfile.monthly_leads,
      conversion_rate: companyProfile.conversion_rate,
    },
    scores: {
      overall,
      demanda:   pillars.demanda.score,
      conversao: pillars.conversao.score,
      escala:    pillars.escala.score,
      level,
    },
    main_bottleneck: {
      type:        main.type,
      severity:    main.severity,
      description: main.description,
    },
    top_priorities: priorities.slice(0, 3).map((p) => ({
      pillar:       p.pillar,
      title:        p.title,
      time_horizon: p.time_horizon,
    })),
    funnel: {
      main_leak:        funnelAnalysis.main_leak,
      lost_revenue_pct: funnelAnalysis.estimated_lost_revenue_pct,
      health:           funnelAnalysis.health_summary,
    },
    archetype: maturity.archetype,
  };
}

// ─── Re-export types and sub-modules for convenience ─────────────────────────
export type { ScoreEngineOutput, AIPayload, Bottleneck, FunnelAnalysis, CommercialPriority } from "./types";
export { SCORE_LEVEL_META, ARCHETYPE_META, PILLAR_WEIGHTS } from "./constants";
