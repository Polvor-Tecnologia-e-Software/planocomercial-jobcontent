/**
 * Schemas Zod da saída estruturada do plano comercial de 90 dias gerado
 * por IA (ver src/lib/ai/commercial-plan.ts). ".strict()" em todo objeto
 * — rejeita qualquer campo que a IA inventar além do combinado, em vez de
 * silenciosamente ignorar (mesma convenção de
 * src/lib/ai/site-analysis-schema.ts).
 *
 * A IA INTERPRETA os números das etapas anteriores (score, gaps, taxas,
 * qualidade de dados) — nunca os recalcula. Por isso quase todo campo
 * numérico aqui vira texto (ex.: indicators.currentValue é string, não
 * number): o texto só pode citar um número que já veio pronto no
 * contexto, nunca inventar um; ver src/lib/ai/numeric-guard.ts para a
 * checagem que impede números não rastreáveis ao contexto.
 */
import { z } from "zod";

// ─── Evidência (hierarquia de confiança) ────────────────────────────────────
export const EvidenceSourceSchema = z.enum([
  "deterministic_calculation",
  "confirmed_data",
  "declared_answer",
  "site_fact",
  "inference",
]);

export const EvidenceSchema = z
  .object({
    summary: z.string().min(1).max(300),
    source: EvidenceSourceSchema,
  })
  .strict();

// ─── Causa-raiz ──────────────────────────────────────────────────────────────
export const RootCauseSchema = z
  .object({
    description: z.string().min(1).max(500),
    evidence: z.array(EvidenceSchema).min(1).max(5),
  })
  .strict();

// ─── Prioridades (exatamente 3) ──────────────────────────────────────────────
export const PrioritySchema = z
  .object({
    title: z.string().min(1).max(100),
    rationale: z.string().min(1).max(400),
    problemSolved: z.string().min(1).max(300),
    expectedImpact: z.string().min(1).max(300),
    primaryIndicator: z.string().min(1).max(150),
    timeframe: z.string().min(1).max(50),
  })
  .strict();

// ─── Plano de 90 dias (3 fases, até 5 ações cada) ────────────────────────────
export const PlanActionSchema = z
  .object({
    title: z.string().min(1).max(120),
    objective: z.string().min(1).max(300),
    suggestedOwner: z.string().min(1).max(60),
    deadline: z.string().min(1).max(50),
    indicator: z.string().min(1).max(150),
    completionCriteria: z.string().min(1).max(250),
    /** Índice (1-3) da prioridade em `priorities` a que esta ação se conecta. */
    relatedPriority: z.number().int().min(1).max(3),
  })
  .strict();

export const PlanPhaseSchema = z.array(PlanActionSchema).min(1).max(5);

export const CommercialPlan90DaysSchema = z
  .object({
    days1to30: PlanPhaseSchema,
    days31to60: PlanPhaseSchema,
    days61to90: PlanPhaseSchema,
  })
  .strict();

// ─── Agenda semanal do gestor (representativa, não um calendário completo) ──
export const WeeklyAgendaItemSchema = z
  .object({
    focus: z.string().min(1).max(150),
    activities: z.array(z.string().min(1).max(150)).min(1).max(5),
  })
  .strict();

export const WeeklyManagerAgendaSchema = z.array(WeeklyAgendaItemSchema).min(1).max(6);

// ─── Indicadores ─────────────────────────────────────────────────────────────
export const IndicatorSchema = z
  .object({
    name: z.string().min(1).max(100),
    /** Texto, não número — só pode citar um valor que já existe no contexto (ver numeric-guard.ts). Null quando o valor atual não é conhecido. */
    currentValue: z
      .string()
      .max(60)
      .nullable()
      .describe(
        "Valor atual deste indicador. Use SOMENTE um número que já apareça literalmente no contexto fornecido (uma taxa, contagem ou meta já calculada). Nunca invente um número novo. Se não houver um valor correspondente no contexto, retorne null.",
      ),
    targetValue: z
      .string()
      .max(60)
      .nullable()
      .describe(
        "Meta deste indicador. Use SOMENTE um número que já apareça literalmente no contexto fornecido (ex.: um valor de requiredFunnel, uma taxa necessária, ou uma meta já calculada) — nunca proponha uma porcentagem ou número novo por conta própria. Se não houver uma meta correspondente no contexto, retorne null em vez de inventar um valor redondo.",
      ),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  })
  .strict();

// ─── CTA consultivo ──────────────────────────────────────────────────────────
export const ConsultativeCtaSchema = z
  .object({
    message: z.string().min(1).max(300),
  })
  .strict();

// ─── Dimensão do gargalo (eco do contexto — nunca decidida livremente aqui) ─
export const BottleneckDimensionSchema = z.enum([
  "demand",
  "conversion",
  "processes",
  "management",
  "scale",
  "digital_positioning",
]);

// ─── Schema principal ─────────────────────────────────────────────────────────
export const CommercialPlanSchema = z
  .object({
    executiveDiagnosis: z.string().min(1).max(600),
    primaryBottleneck: BottleneckDimensionSchema,
    secondaryRisk: BottleneckDimensionSchema.nullable(),
    evidence: z.array(EvidenceSchema).min(1).max(8),
    rootCause: RootCauseSchema,
    goalGapInterpretation: z.string().min(1).max(500),
    priorities: z.array(PrioritySchema).length(3),
    plan90Days: CommercialPlan90DaysSchema,
    weeklyManagerAgenda: WeeklyManagerAgendaSchema,
    indicators: z.array(IndicatorSchema).min(1).max(10),
    limitations: z.array(z.string().min(1).max(300)).min(1).max(6),
    consultativeCta: ConsultativeCtaSchema,
  })
  .strict();

export type Evidence = z.infer<typeof EvidenceSchema>;
export type RootCause = z.infer<typeof RootCauseSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type PlanAction = z.infer<typeof PlanActionSchema>;
export type CommercialPlan90Days = z.infer<typeof CommercialPlan90DaysSchema>;
export type WeeklyAgendaItem = z.infer<typeof WeeklyAgendaItemSchema>;
export type Indicator = z.infer<typeof IndicatorSchema>;
export type ConsultativeCta = z.infer<typeof ConsultativeCtaSchema>;
export type CommercialPlan = z.infer<typeof CommercialPlanSchema>;
