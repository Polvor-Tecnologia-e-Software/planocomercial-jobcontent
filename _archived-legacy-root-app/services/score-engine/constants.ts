import type { ScoreLevel } from "@/types";
import type { CommercialArchetype, MaturityProfile } from "./types";

// ─── Pillar weights in overall score ─────────────────────────────────────────
// Demanda is most impactful in B2B: no leads = no revenue.
// Conversão second: process determines win rate.
// Escala third: relevant only once the other two work.
export const PILLAR_WEIGHTS = {
  demanda:   0.40,
  conversao: 0.35,
  escala:    0.25,
} as const;

// ─── Score level thresholds ───────────────────────────────────────────────────
export const SCORE_THRESHOLDS: Record<ScoreLevel, { min: number; max: number }> = {
  critico:       { min: 0,  max: 29 },
  basico:        { min: 30, max: 49 },
  intermediario: { min: 50, max: 69 },
  avancado:      { min: 70, max: 84 },
  elite:         { min: 85, max: 100 },
};

// ─── Level metadata ───────────────────────────────────────────────────────────
export const SCORE_LEVEL_META: Record<
  ScoreLevel,
  { label: string; description: string; color: string; next: ScoreLevel | null }
> = {
  critico: {
    label: "Crítico",
    description: "Máquina comercial com sérios gargalos estruturais. Ação imediata necessária para evitar perda de receita.",
    color: "#ef4444",
    next: "basico",
  },
  basico: {
    label: "Básico",
    description: "Fundação comercial existe, mas falta consistência e estrutura. Alto potencial de ganho rápido.",
    color: "#f59e0b",
    next: "intermediario",
  },
  intermediario: {
    label: "Intermediário",
    description: "Processo em desenvolvimento com resultados inconsistentes. Pequenas melhorias geram grande impacto.",
    color: "#3b82f6",
    next: "avancado",
  },
  avancado: {
    label: "Avançado",
    description: "Máquina comercial sólida e funcionando. Foco em otimização, automação e escala.",
    color: "#10b981",
    next: "elite",
  },
  elite: {
    label: "Elite",
    description: "Operação comercial de alta performance. Benchmark do setor B2B. Foco em inovação e expansão.",
    color: "#0ea5e9",
    next: null,
  },
};

// ─── Commercial archetypes ────────────────────────────────────────────────────
export const ARCHETYPE_META: Record<
  CommercialArchetype,
  { label: string; description: string }
> = {
  founder_seller: {
    label: "Founder Seller",
    description: "O fundador é o principal (ou único) vendedor. Alto risco de dependência pessoal.",
  },
  early_team: {
    label: "Time Inicial",
    description: "Time pequeno sem processos padronizados. Crescimento depende de esforço individual.",
  },
  building_machine: {
    label: "Construindo a Máquina",
    description: "Processo comercial em estruturação. Potencial claro de escala quando fundação for concluída.",
  },
  scaling_machine: {
    label: "Máquina em Escala",
    description: "Operação estruturada e replicável. Crescimento previsível com investimento em equipe.",
  },
  performance_engine: {
    label: "Motor de Performance",
    description: "Operação de alta performance com métricas, processo e equipe alinhados.",
  },
};

// ─── Funnel stage benchmarks (B2B SaaS/Services industry) ───────────────────
// Conversion benchmarks: what % of each stage converts to the next
export const FUNNEL_BENCHMARKS: Record<string, {
  label: string;
  benchmark_conversion: number; // % to next stage
  description: string;
}> = {
  leads:         { label: "Leads",          benchmark_conversion: 25,  description: "% de leads que viram MQL" },
  mql:           { label: "MQLs",           benchmark_conversion: 40,  description: "% de MQL que viram SQL/oportunidade" },
  oportunidades: { label: "Oportunidades",  benchmark_conversion: 40,  description: "% de oportunidades que recebem proposta" },
  propostas:     { label: "Propostas",      benchmark_conversion: 35,  description: "% de propostas que fecham" },
  clientes:      { label: "Clientes",       benchmark_conversion: 100, description: "Clientes fechados" },
};

// ─── Lead volume mapping (from m3_q2 answer value) ───────────────────────────
export const LEAD_VOLUME_MAP: Record<string, number> = {
  "0_10":   5,    // midpoint estimate
  "10_50":  30,
  "50_200": 125,
  "200+":   300,
};

// ─── Avg ticket mapping (from m1_q3 answer value) ────────────────────────────
export const TICKET_MAP: Record<string, number> = {
  "ate_2k":  1500,
  "2k_10k":  6000,
  "10k_50k": 30000,
  "50k+":    80000,
};

// ─── Conversion rate mapping (from m4_q1 answer value) ───────────────────────
export const CONVERSION_RATE_MAP: Record<string, number> = {
  "abaixo_5": 3,
  "5_15":     10,
  "15_30":    22,
  "acima_30": 35,
};

// ─── Bottleneck severity thresholds ─────────────────────────────────────────
// A pillar is "critical" if score ≤ 35, "moderate" ≤ 55, else "mild"
export const BOTTLENECK_SEVERITY_THRESHOLDS = {
  critical: 35,
  moderate: 55,
} as const;

// ─── Question-level signal mapping ───────────────────────────────────────────
// Specific answers that carry extra diagnostic signal
export const CRITICAL_SIGNALS: Record<string, { label: string; pillar: string }> = {
  // Demanda signals
  "m3_q1:indicacao":    { label: "Dependência exclusiva de indicações", pillar: "demanda" },
  "m3_q2:0_10":         { label: "Volume crítico de leads (<10/mês)",    pillar: "demanda" },
  "m3_q3:nao_conhece":  { label: "ICP inexistente",                      pillar: "demanda" },
  "m3_q4:nunca":        { label: "Zero prospecção ativa",                pillar: "demanda" },
  // Conversão signals
  "m4_q1:abaixo_5":     { label: "Taxa de conversão crítica (<5%)",      pillar: "conversao" },
  "m4_q2:nao":          { label: "Processo de vendas inexistente",       pillar: "conversao" },
  "m4_q3:nenhum":       { label: "Zero follow-up sistemático",           pillar: "conversao" },
  // Escala signals
  "m2_q1:nao":          { label: "Sem metas comerciais definidas",       pillar: "escala" },
  "m5_q1:nao":          { label: "CRM inexistente",                      pillar: "escala" },
  "m6_q2:nao_mensura":  { label: "CAC e LTV desconhecidos",              pillar: "escala" },
};
