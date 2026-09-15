/**
 * Vocabulário compartilhado do motor determinístico de cálculos (seção 7
 * do BRD: score, confiança e gargalo — nunca calculado pela IA).
 */
import type { ConfidenceLevel, Dimension, Severity } from "@/types/tables";

// ─── 1. Métricas comerciais normalizadas ────────────────────────────────────
export type CommercialMetrics = {
  averageTicket: number | null; // U1
  salesCycleDays: number | null; // U2
  teamSize: number | null; // U3
  monthlyGoal: number | null; // U4
  /** U5 — mesma resposta também alimenta salesPerMonth (mesmo dado real, usado em dois cálculos diferentes). */
  currentMonthlySales: number | null;
  leadsPerMonth: number | null; // U6
  opportunitiesPerMonth: number | null; // U7
  meetingsPerMonth: number | null; // U8
  proposalsPerMonth: number | null; // U9
  /** U5 — ver nota em currentMonthlySales. */
  salesPerMonth: number | null;
  /** D3_Q2 — só presente quando D3 foi o desafio escolhido. */
  proposalStallDays: number | null;
  /** Taxa lead->oportunidade autodeclarada por faixa (D2_Q2) — só presente quando D2 foi o desafio escolhido. */
  declaredLeadToOpportunityRate: RateValue | null;
};

// ─── 2. Taxas de conversão ───────────────────────────────────────────────────
export type RateSource = "computed" | "declared_bucket";

export type RateValue = {
  /** 0 a 1. */
  value: number;
  source: RateSource;
};

export type ConversionRates = {
  leadToOpportunity: RateValue | null;
  opportunityToMeeting: RateValue | null;
  meetingToProposal: RateValue | null;
  proposalToSale: RateValue | null;
};

export type FunnelStage =
  | "lead_to_opportunity"
  | "opportunity_to_meeting"
  | "meeting_to_proposal"
  | "proposal_to_sale";

// ─── 3. Engenharia reversa da meta ──────────────────────────────────────────
export type ReverseEngineeringResult = {
  requiredCustomers: number | null;
  currentCustomerGap: number | null;
  requiredProposals: number | null;
  requiredMeetings: number | null;
  requiredOpportunities: number | null;
  requiredLeads: number | null;
  /** Nomes dos dados que faltaram para a cadeia continuar (ex.: "monthlyGoal", "proposalToSaleRate"). */
  missingData: string[];
  /** Premissas usadas no cálculo (ex.: taxa estimada a partir de uma faixa declarada). */
  assumptions: string[];
};

// ─── 4. Gaps do funil ────────────────────────────────────────────────────────
export type StageGap =
  | { available: true; required: number; current: number; gap: number }
  | { available: false };

export type FunnelGaps = {
  customers: StageGap;
  proposals: StageGap;
  meetings: StageGap;
  opportunities: StageGap;
  leads: StageGap;
};

// ─── 5. Simulação ────────────────────────────────────────────────────────────
export type SimulateConversionChangeInput = {
  stage: FunnelStage;
  /** 0 a 1. */
  currentRate: number;
  /** 0 a 1. */
  simulatedRate: number;
  /** Volume na entrada do estágio (ex.: leads, para lead_to_opportunity). */
  currentVolume: number;
};

export type SimulateConversionChangeResult = {
  stage: FunnelStage;
  currentScenario: { rate: number; volumeIn: number; volumeOut: number };
  simulatedScenario: { rate: number; volumeIn: number; volumeOut: number };
  variableChanged: "rate";
  valuesKept: { volumeIn: number };
  delta: {
    volumeOut: number;
    /** null quando o cenário atual não gera nenhuma saída para comparar (divisão por zero evitada). */
    percentChange: number | null;
  };
  assumptions: string[];
};

// ─── 6. Qualidade de dados ───────────────────────────────────────────────────
export type DataQualityResult = {
  dataQualityPercentage: number; // 0-100
  confidence: ConfidenceLevel;
  applicableCount: number;
  answeredCount: number;
  uncertainCount: number;
  criticalMetricsAvailable: number;
  criticalMetricsTotal: number;
};

// ─── 7. Score por dimensão ───────────────────────────────────────────────────
export type ScoreEvidenceItem = {
  questionKey: string;
  answerValue: string;
  points: number;
};

export type DimensionScoreResult = {
  dimension: Dimension;
  /** 0-100. Neutro (50) quando não há nenhuma pergunta de seleção respondida para esta dimensão. */
  score: number;
  /** Quantidade de respostas que realmente contribuíram — 0 significa "sem dados", não "score ruim". */
  weight: number;
  evidence: ScoreEvidenceItem[];
};

export type ScoreResult = {
  dimensions: Record<Dimension, DimensionScoreResult>;
  /** Média ponderada por DIMENSION_WEIGHTS entre as dimensões com weight > 0; null se nenhuma tiver dados. */
  overallScore: number | null;
};

// ─── 8. Sinais ────────────────────────────────────────────────────────────────
export type SignalEvidenceItem = {
  questionKey: string;
  answerValue: string;
};

export type DetectedSignal = {
  code: string;
  dimension: Dimension;
  severity: Severity;
  evidence: SignalEvidenceItem[];
};

// ─── 9. Gargalo ───────────────────────────────────────────────────────────────
export type BottleneckResult = {
  primaryBottleneckCandidate: Dimension | null;
  secondaryRiskCandidate: Dimension | null;
  supportingSignals: string[];
  confidence: ConfidenceLevel;
  /** Trilha legível de como a decisão foi tomada — para depuração/auditoria, não para o usuário final. */
  rationale: string[];
};

// ─── Resultado agregado (o que o orquestrador puro devolve) ─────────────────
export type DeterministicAnalysisResult = {
  metrics: CommercialMetrics;
  rates: ConversionRates;
  reverseEngineering: ReverseEngineeringResult;
  /** 0-100 — quantos dos 5 estágios da engenharia reversa puderam ser calculados. Diferente de dataQuality.dataQualityPercentage (ver reverse-engineering.computeFunnelCompletenessPercentage). */
  funnelCompletenessPercentage: number;
  gaps: FunnelGaps;
  dataQuality: DataQualityResult;
  score: ScoreResult;
  signals: DetectedSignal[];
  bottleneck: BottleneckResult;
};
