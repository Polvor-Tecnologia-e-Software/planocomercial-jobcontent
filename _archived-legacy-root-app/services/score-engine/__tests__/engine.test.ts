/**
 * Score Engine Tests
 *
 * Pure TypeScript test runner — no Jest, no dependencies.
 * Run with: npx tsx services/score-engine/__tests__/engine.test.ts
 *
 * Each test is a function that throws on failure.
 * Results are printed to stdout.
 */

// NOTE: When running tests, path aliases (@/) won't work in tsx without config.
// Tests import from relative paths.

import { runScoreEngine } from "../index";
import {
  FIXTURE_CRITICAL,
  FIXTURE_BASIC,
  FIXTURE_INTERMEDIARIO,
  FIXTURE_ELITE,
  FIXTURE_DEMAND_BOTTLENECK,
  FIXTURE_PARTIAL,
} from "./fixtures";
import { DIAGNOSTIC_QUESTIONS } from "../../../lib/diagnostic-questions";

// ─── Minimal assertion helpers ────────────────────────────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertRange(value: number, min: number, max: number, label: string): void {
  if (value < min || value > max) {
    throw new Error(`FAIL: ${label} — ${value} not in [${min}, ${max}]`);
  }
}

function assertLt(a: number, b: number, label: string): void {
  if (a >= b) throw new Error(`FAIL: ${label} — expected ${a} < ${b}`);
}

// ─── Test runner ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const errors: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ ${name}`);
    console.log(`      ${msg}`);
    failed++;
    errors.push(`${name}: ${msg}`);
  }
}

function suite(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUITES
// ═══════════════════════════════════════════════════════════════════════════════

suite("Score ranges (0-100)", () => {
  test("Critical company scores are in range", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assertRange(o.scores.overall,   0, 100, "overall");
    assertRange(o.scores.demanda,   0, 100, "demanda");
    assertRange(o.scores.conversao, 0, 100, "conversao");
    assertRange(o.scores.escala,    0, 100, "escala");
  });

  test("Elite company scores are in range", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertRange(o.scores.overall,   0, 100, "overall");
    assertRange(o.scores.demanda,   0, 100, "demanda");
    assertRange(o.scores.conversao, 0, 100, "conversao");
    assertRange(o.scores.escala,    0, 100, "escala");
  });
});

suite("Level classification", () => {
  test("All-zero answers → level critico", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assertEq(o.scores.level, "critico", "level");
  });

  test("All-max answers → level elite", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertEq(o.scores.level, "elite", "level");
  });

  test("Intermediate fixture → level intermediario or avancado", () => {
    const o = runScoreEngine(FIXTURE_INTERMEDIARIO, DIAGNOSTIC_QUESTIONS);
    assert(
      o.scores.level === "intermediario" || o.scores.level === "avancado",
      `expected intermediario or avancado, got ${o.scores.level}`
    );
  });
});

suite("Score monotonicity", () => {
  test("Elite overall > Intermediario overall > Basic overall > Critical overall", () => {
    const elite = runScoreEngine(FIXTURE_ELITE,          DIAGNOSTIC_QUESTIONS).scores.overall;
    const inter = runScoreEngine(FIXTURE_INTERMEDIARIO,  DIAGNOSTIC_QUESTIONS).scores.overall;
    const basic = runScoreEngine(FIXTURE_BASIC,          DIAGNOSTIC_QUESTIONS).scores.overall;
    const crit  = runScoreEngine(FIXTURE_CRITICAL,       DIAGNOSTIC_QUESTIONS).scores.overall;

    assertLt(crit,  basic,  "critical < basic");
    assertLt(basic, inter,  "basic < inter");
    assertLt(inter, elite,  "inter < elite");
  });
});

suite("Bottleneck detection", () => {
  test("Critical company → at least 1 bottleneck with severity critical", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    const hasCritical = o.bottlenecks.some((b) => b.severity === "critical");
    assert(hasCritical, "expected at least one critical bottleneck");
  });

  test("Demand bottleneck fixture → main bottleneck is demanda", () => {
    const o = runScoreEngine(FIXTURE_DEMAND_BOTTLENECK, DIAGNOSTIC_QUESTIONS);
    assertEq(o.bottlenecks[0].type, "demanda", "main bottleneck type");
  });

  test("Elite company → no critical bottlenecks", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    const hasCritical = o.bottlenecks.some((b) => b.severity === "critical");
    assert(!hasCritical, "elite should have no critical bottlenecks");
  });

  test("Bottlenecks array always has 3 entries (one per pillar)", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    assertEq(o.bottlenecks.length, 3, "bottlenecks length");
  });

  test("Bottlenecks sorted ascending by score (worst first)", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    const [b0, b1, b2] = o.bottlenecks;
    assert(b0.score <= b1.score, "b0.score <= b1.score");
    assert(b1.score <= b2.score, "b1.score <= b2.score");
  });
});

suite("Funnel analysis", () => {
  test("Funnel always has 5 stages", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    assertEq(o.funnel_analysis.stages.length, 5, "stages count");
  });

  test("Funnel stages are ordered: leads → mql → oportunidades → propostas → clientes", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    const ids = o.funnel_analysis.stages.map((s) => s.id);
    assertEq(ids[0], "leads",          "stage[0]");
    assertEq(ids[4], "clientes",       "stage[4]");
  });

  test("Critical company funnel has health critical or warning", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assert(
      o.funnel_analysis.health_summary !== "healthy",
      "critical company should not have healthy funnel"
    );
  });

  test("Elite company funnel: estimated_monthly clientes > 0", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    const clientes = o.funnel_analysis.stages.find((s) => s.id === "clientes");
    assert((clientes?.estimated_monthly ?? 0) > 0, "clientes volume > 0");
  });

  test("Lost revenue pct is between 0 and 95", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assertRange(o.funnel_analysis.estimated_lost_revenue_pct, 0, 95, "lost_revenue_pct");
  });
});

suite("Company profile extraction", () => {
  test("Critical fixture → has_icp = false", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assertEq(o.company_profile.has_icp, false, "has_icp");
  });

  test("Elite fixture → uses_crm = true", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertEq(o.company_profile.uses_crm, true, "uses_crm");
  });

  test("Critical fixture → uses_crm = false", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assertEq(o.company_profile.uses_crm, false, "uses_crm");
  });

  test("Elite fixture → knows_cac_ltv = true", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertEq(o.company_profile.knows_cac_ltv, true, "knows_cac_ltv");
  });
});

suite("Maturity and archetype", () => {
  test("Critical fixture → archetype founder_seller or early_team", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assert(
      ["founder_seller", "early_team"].includes(o.maturity.archetype),
      `expected founder_seller or early_team, got ${o.maturity.archetype}`
    );
  });

  test("Elite fixture → archetype performance_engine", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertEq(o.maturity.archetype, "performance_engine", "archetype");
  });

  test("points_to_next = 0 for elite level", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assertEq(o.maturity.points_to_next, 0, "points_to_next");
  });

  test("points_to_next > 0 for non-elite", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assert(o.maturity.points_to_next > 0, "should need points to reach next level");
  });
});

suite("Priorities", () => {
  test("Always generates at least 1 priority", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assert(o.priorities.length >= 1, "priorities.length >= 1");
  });

  test("Priorities have valid time_horizon values", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    const valid = ["30d", "60d", "90d"];
    for (const p of o.priorities) {
      assert(valid.includes(p.time_horizon), `invalid time_horizon: ${p.time_horizon}`);
    }
  });

  test("Priorities ranked consecutively from 1", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    o.priorities.forEach((p, i) => {
      assertEq(p.rank, i + 1, `priority rank at index ${i}`);
    });
  });

  test("No more than 6 priorities", () => {
    const o = runScoreEngine(FIXTURE_CRITICAL, DIAGNOSTIC_QUESTIONS);
    assert(o.priorities.length <= 6, "max 6 priorities");
  });
});

suite("AI payload (lean token budget)", () => {
  test("AI payload JSON is under 1500 characters", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    const json = JSON.stringify(o.ai_payload);
    assert(json.length < 1500, `AI payload too large: ${json.length} chars`);
  });

  test("AI payload has all required top-level keys", () => {
    const o = runScoreEngine(FIXTURE_BASIC, DIAGNOSTIC_QUESTIONS);
    const keys = ["company", "scores", "main_bottleneck", "top_priorities", "funnel", "archetype"];
    for (const k of keys) {
      assert(k in o.ai_payload, `missing key: ${k}`);
    }
  });

  test("top_priorities has max 3 items", () => {
    const o = runScoreEngine(FIXTURE_ELITE, DIAGNOSTIC_QUESTIONS);
    assert(o.ai_payload.top_priorities.length <= 3, "max 3 top priorities in AI payload");
  });
});

suite("Partial answers (robustness)", () => {
  test("Engine handles partial answers without crashing", () => {
    const o = runScoreEngine(FIXTURE_PARTIAL, DIAGNOSTIC_QUESTIONS);
    assertRange(o.scores.overall,   0, 100, "overall");
    assertRange(o.scores.demanda,   0, 100, "demanda");
    assertRange(o.scores.conversao, 0, 100, "conversao");
    assertRange(o.scores.escala,    0, 100, "escala");
  });

  test("Engine handles empty answers without crashing", () => {
    const o = runScoreEngine([], DIAGNOSTIC_QUESTIONS);
    assertEq(o.scores.overall, 0, "overall should be 0 with no answers");
    assertEq(o.completion_pct, 0, "completion should be 0%");
  });

  test("Completion pct is correct", () => {
    const o = runScoreEngine(FIXTURE_PARTIAL, DIAGNOSTIC_QUESTIONS);
    // FIXTURE_PARTIAL has 4 answers, total is 18
    assertEq(o.completion_pct, Math.round((4 / 18) * 100), "completion_pct");
    assertEq(o.answers_count, 4, "answers_count");
  });
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Score Engine Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`\nFailed tests:`);
  errors.forEach((e) => console.log(`  • ${e}`));
  process.exit(1);
} else {
  console.log("All tests passed ✓");
}
