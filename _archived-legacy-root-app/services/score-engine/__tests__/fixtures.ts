import type { DiagnosticAnswer } from "@/types";

// ─── Helper: build answer ──────────────────────────────────────────────────────
function a(question_id: string, value: string, score: number): DiagnosticAnswer {
  return { question_id, value, score };
}

// ─── Fixture 1: Critical company ──────────────────────────────────────────────
// Solo founder, no process, no CRM, only referrals, <10 leads/month
export const FIXTURE_CRITICAL: DiagnosticAnswer[] = [
  a("m1_q1", "estruturando", 2),
  a("m1_q2", "1",            2),
  a("m1_q3", "ate_2k",       3),
  a("m2_q1", "nao",          0),
  a("m2_q2", "nenhum",       0),
  a("m3_q1", "indicacao",    2),
  a("m3_q2", "0_10",         1),
  a("m3_q3", "nao_conhece",  0),
  a("m3_q4", "nunca",        0),
  a("m4_q1", "abaixo_5",     2),
  a("m4_q2", "nao",          0),
  a("m4_q3", "nenhum",       0),
  a("m4_q4", "nao",          0),
  a("m5_q1", "nao",          0),
  a("m5_q2", "nao",          0),
  a("m5_q3", "nao_replica",  0),
  a("m6_q1", "nao",          0),
  a("m6_q2", "nao_mensura",  0),
];

// ─── Fixture 2: Basic company ─────────────────────────────────────────────────
// Small team (2-3), some process, 10-50 leads, basic CRM
export const FIXTURE_BASIC: DiagnosticAnswer[] = [
  a("m1_q1", "funcionando",    5),
  a("m1_q2", "2_3",            5),
  a("m1_q3", "2k_10k",         6),
  a("m2_q1", "informal",       3),
  a("m2_q2", "reunioes",       3),
  a("m3_q1", "inbound_basico", 4),
  a("m3_q2", "10_50",          4),
  a("m3_q3", "informal",       3),
  a("m3_q4", "esporadico",     2),
  a("m4_q1", "5_15",           5),
  a("m4_q2", "basico",         3),
  a("m4_q3", "manual",         2),
  a("m4_q4", "basico",         3),
  a("m5_q1", "parcial",        3),
  a("m5_q2", "informal",       2),
  a("m5_q3", "lento",          3),
  a("m6_q1", "basico",         3),
  a("m6_q2", "estimativa",     3),
];

// ─── Fixture 3: Intermediate company ─────────────────────────────────────────
// Team of 4-8, documented process, CRM in use, mix of inbound+outbound
export const FIXTURE_INTERMEDIARIO: DiagnosticAnswer[] = [
  a("m1_q1", "crescendo",   7),
  a("m1_q2", "4_8",         7),
  a("m1_q3", "10k_50k",     8),
  a("m2_q1", "definida",    6),
  a("m2_q2", "planilha",    5),
  a("m3_q1", "misto",       7),
  a("m3_q2", "50_200",      7),
  a("m3_q3", "documentado", 6),
  a("m3_q4", "semanal",     6),
  a("m4_q1", "15_30",       8),
  a("m4_q2", "documentado", 6),
  a("m4_q3", "agendado",    5),
  a("m4_q4", "varios",      6),
  a("m5_q1", "usado",       6),
  a("m5_q2", "parcial",     5),
  a("m5_q3", "medio",       6),
  a("m6_q1", "bom",         7),
  a("m6_q2", "periodico",   7),
];

// ─── Fixture 4: Elite company ─────────────────────────────────────────────────
// Large team, full CRM, multi-channel, high conversion, real-time metrics
export const FIXTURE_ELITE: DiagnosticAnswer[] = [
  a("m1_q1", "escalando",    10),
  a("m1_q2", "9+",           10),
  a("m1_q3", "50k+",         10),
  a("m2_q1", "documentada",  10),
  a("m2_q2", "crm",          10),
  a("m3_q1", "multicanal",   10),
  a("m3_q2", "200+",         10),
  a("m3_q3", "ativo",        10),
  a("m3_q4", "diario",       10),
  a("m4_q1", "acima_30",     10),
  a("m4_q2", "otimizado",    10),
  a("m4_q3", "cadencia",     10),
  a("m4_q4", "completo",     10),
  a("m5_q1", "otimizado",    10),
  a("m5_q2", "completo",     10),
  a("m5_q3", "rapido",       10),
  a("m6_q1", "excelente",    10),
  a("m6_q2", "tempo_real",   10),
];

// ─── Fixture 5: Demand bottleneck ─────────────────────────────────────────────
// Good process and scale, but very weak demand generation
export const FIXTURE_DEMAND_BOTTLENECK: DiagnosticAnswer[] = [
  a("m1_q1", "crescendo",   7),
  a("m1_q2", "4_8",         7),
  a("m1_q3", "10k_50k",     8),
  a("m2_q1", "documentada", 10),
  a("m2_q2", "crm",         10),
  a("m3_q1", "indicacao",   2),  // weak
  a("m3_q2", "0_10",         1), // weak
  a("m3_q3", "nao_conhece",  0), // weak
  a("m3_q4", "nunca",        0), // weak
  a("m4_q1", "acima_30",    10),
  a("m4_q2", "otimizado",   10),
  a("m4_q3", "cadencia",    10),
  a("m4_q4", "completo",    10),
  a("m5_q1", "otimizado",   10),
  a("m5_q2", "completo",    10),
  a("m5_q3", "rapido",      10),
  a("m6_q1", "excelente",   10),
  a("m6_q2", "tempo_real",  10),
];

// ─── Fixture 6: Partial answers (incomplete diagnostic) ───────────────────────
export const FIXTURE_PARTIAL: DiagnosticAnswer[] = [
  a("m1_q1", "funcionando", 5),
  a("m1_q2", "2_3",          5),
  a("m3_q1", "misto",        7),
  a("m4_q1", "5_15",         5),
];
