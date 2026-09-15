import type { DiagnosticAnswer } from "@/types";
import type { FunnelAnalysis, FunnelStage, AnswerMap } from "./types";
import {
  LEAD_VOLUME_MAP,
  TICKET_MAP,
  CONVERSION_RATE_MAP,
  FUNNEL_BENCHMARKS,
} from "./constants";
import { buildAnswerMap } from "./calculator";

// ─── Extract numeric context from answers ────────────────────────────────────
export function extractFunnelContext(answers: DiagnosticAnswer[]): {
  monthly_leads: number;
  avg_ticket: number;
  lead_to_client_conversion: number;
} {
  const map = buildAnswerMap(answers);

  const leadAnswer  = map.get("m3_q2");
  const ticketAnswer = map.get("m1_q3");
  const convAnswer  = map.get("m4_q1");

  const monthly_leads = LEAD_VOLUME_MAP[String(leadAnswer?.value ?? "0_10")] ?? 5;
  const avg_ticket    = TICKET_MAP[String(ticketAnswer?.value ?? "ate_2k")] ?? 1500;
  const lead_to_client_conversion =
    CONVERSION_RATE_MAP[String(convAnswer?.value ?? "abaixo_5")] ?? 3;

  return { monthly_leads, avg_ticket, lead_to_client_conversion };
}

// ─── Build funnel stages from extracted context ───────────────────────────────
// We model 5 stages: leads → MQL → Oportunidades → Propostas → Clientes
// Conversion rates between stages are back-calculated from the total lead→client rate,
// then compared against B2B benchmarks.
export function buildFunnelStages(
  answers: DiagnosticAnswer[],
  answerMap: AnswerMap
): FunnelStage[] {
  const { monthly_leads, lead_to_client_conversion } = extractFunnelContext(answers);

  // Estimate individual stage conversions from total conversion rate.
  // We use a geometric distribution: if total = lead_to_client_pct,
  // and there are 4 conversions, each step ≈ total^(1/4)
  const totalConvDecimal = Math.min(lead_to_client_conversion / 100, 0.99);
  const perStepConv = Math.pow(totalConvDecimal, 1 / 4); // 4 conversion steps

  // Estimated volumes at each stage
  const leadsVol       = monthly_leads;
  const mqlVol         = Math.round(leadsVol    * perStepConv);
  const opVol          = Math.round(mqlVol      * perStepConv);
  const propVol        = Math.round(opVol       * perStepConv);
  const clientesVol    = Math.round(propVol     * perStepConv);

  // Actual conversion rates per stage (pct)
  const leadsToMql     = leadsVol > 0    ? (mqlVol    / leadsVol)    * 100 : 0;
  const mqlToOp        = mqlVol > 0      ? (opVol     / mqlVol)      * 100 : 0;
  const opToProp       = opVol > 0       ? (propVol   / opVol)       * 100 : 0;
  const propToClient   = propVol > 0     ? (clientesVol / propVol)   * 100 : 0;

  const stageData: Array<{
    id: string;
    volume: number;
    actual_conv: number;
  }> = [
    { id: "leads",         volume: leadsVol,    actual_conv: leadsToMql   },
    { id: "mql",           volume: mqlVol,      actual_conv: mqlToOp      },
    { id: "oportunidades", volume: opVol,        actual_conv: opToProp     },
    { id: "propostas",     volume: propVol,      actual_conv: propToClient },
    { id: "clientes",      volume: clientesVol,  actual_conv: 100          },
  ];

  return stageData.map(({ id, volume, actual_conv }) => {
    const bench = FUNNEL_BENCHMARKS[id];
    const gap   = Number((actual_conv - bench.benchmark_conversion).toFixed(1));
    const health = classifyStageHealth(actual_conv, bench.benchmark_conversion);

    return {
      id,
      label:                bench.label,
      estimated_monthly:    volume,
      conversion_to_next:   Number(actual_conv.toFixed(1)),
      benchmark_conversion: bench.benchmark_conversion,
      gap_vs_benchmark:     gap,
      health,
    };
  });
}

// ─── Classify stage health ────────────────────────────────────────────────────
function classifyStageHealth(
  actual: number,
  benchmark: number
): FunnelStage["health"] {
  const ratio = actual / benchmark;
  if (ratio >= 0.8) return "healthy";
  if (ratio >= 0.5) return "warning";
  return "critical";
}

// ─── Build full funnel analysis ───────────────────────────────────────────────
export function analyzeFunnel(
  answers: DiagnosticAnswer[],
  answerMap: AnswerMap
): FunnelAnalysis {
  const stages = buildFunnelStages(answers, answerMap);

  // Find the stage with the biggest gap vs benchmark (worst performer, excl. clientes)
  const nonFinalStages = stages.filter((s) => s.id !== "clientes");
  const mainLeak = nonFinalStages.reduce(
    (worst, s) => (s.gap_vs_benchmark < worst.gap_vs_benchmark ? s : worst),
    nonFinalStages[0]
  );

  // Estimate lost revenue: stages with "critical" or "warning" health
  const criticalStages = stages.filter((s) => s.health === "critical").length;
  const warningStages  = stages.filter((s) => s.health === "warning").length;
  const lostRevenuePct = Math.min(
    95,
    criticalStages * 30 + warningStages * 15
  );

  const worstHealth = stages.some((s) => s.health === "critical")
    ? "critical"
    : stages.some((s) => s.health === "warning")
    ? "warning"
    : "healthy";

  return {
    stages,
    main_leak: mainLeak?.id ?? "leads",
    estimated_lost_revenue_pct: lostRevenuePct,
    health_summary: worstHealth,
  };
}
