import "server-only";

import { aiReports, companies, diagnostics, funnelAnalyses, seoAnalyses } from "@/lib/database";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import { CommercialPlanSchema, type CommercialPlan } from "@/schemas/commercial-plan";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

/** Acima disso, um relatório "generating" é tratado como travado (o processo provavelmente morreu antes de marcar failed) e a pessoa pode tentar de novo. */
const STALE_GENERATING_MS = 90_000;

export type ResultFunnelStage = {
  key: "leads" | "opportunities" | "meetings" | "proposals" | "customers";
  label: string;
  current: number | null;
  required: number | null;
  gap: number | null;
  ratePercent: number | null;
  rateLabel: string | null;
  /** true quando NENHUM valor (current/required/gap/rate) pôde ser calculado para este estágio. */
  uncalculable: boolean;
};

export type CommercialPlanResultState =
  | { status: "not_found" }
  | { status: "not_generated"; diagnosticId: string; companyName: string }
  | { status: "generating"; diagnosticId: string; companyName: string }
  | {
      status: "failed";
      diagnosticId: string;
      companyName: string;
      reason: string | null;
      canRetry: boolean;
    }
  | {
      status: "completed";
      diagnosticId: string;
      companyName: string;
      generatedAt: string;
      plan: CommercialPlan;
      funnelStages: ResultFunnelStage[];
      primaryBottleneck: Dimension | null;
      secondaryRisk: Dimension | null;
      dataQualityPercentage: number | null;
      confidence: ConfidenceLevel | null;
      /** [] quando não há palavras-chave informadas, ou a sugestão por IA falhou — a seção de SEO simplesmente não aparece nesse caso. */
      seoOpportunities: KeywordOpportunity[];
    };

function isStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > STALE_GENERATING_MS;
}

function readRatePercent(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const value = (raw as Record<string, unknown>).value;
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) : null;
}

function readCurrentValue(raw: unknown, key: string): number | null {
  if (!raw || typeof raw !== "object") return null;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

function readRequiredAndGap(raw: unknown): { required: number | null; gap: number | null } {
  if (!raw || typeof raw !== "object") return { required: null, gap: null };
  const stage = raw as Record<string, unknown>;
  if (stage.available !== true) return { required: null, gap: null };
  return {
    required: typeof stage.required === "number" ? stage.required : null,
    gap: typeof stage.gap === "number" ? stage.gap : null,
  };
}

const STAGE_DEFINITIONS: {
  key: ResultFunnelStage["key"];
  label: string;
  currentKey: string;
  rateKey: string | null;
  rateLabel: string | null;
}[] = [
  { key: "leads", label: "Leads", currentKey: "leadsPerMonth", rateKey: null, rateLabel: null },
  {
    key: "opportunities",
    label: "Oportunidades",
    currentKey: "opportunitiesPerMonth",
    rateKey: "leadToOpportunity",
    rateLabel: "Lead → Oportunidade",
  },
  {
    key: "meetings",
    label: "Reuniões",
    currentKey: "meetingsPerMonth",
    rateKey: "opportunityToMeeting",
    rateLabel: "Oportunidade → Reunião",
  },
  {
    key: "proposals",
    label: "Propostas",
    currentKey: "proposalsPerMonth",
    rateKey: "meetingToProposal",
    rateLabel: "Reunião → Proposta",
  },
  {
    key: "customers",
    label: "Vendas",
    currentKey: "currentMonthlySales",
    rateKey: "proposalToSale",
    rateLabel: "Proposta → Venda",
  },
];

function buildFunnelStages(currentFunnelRaw: unknown, gapsRaw: unknown, ratesRaw: unknown): ResultFunnelStage[] {
  const gaps = (gapsRaw ?? {}) as Record<string, unknown>;
  const rates = (ratesRaw ?? {}) as Record<string, unknown>;

  return STAGE_DEFINITIONS.map((def) => {
    const current = readCurrentValue(currentFunnelRaw, def.currentKey);
    const { required, gap } = readRequiredAndGap(gaps[def.key]);
    const ratePercent = def.rateKey ? readRatePercent(rates[def.rateKey]) : null;

    return {
      key: def.key,
      label: def.label,
      current,
      required,
      gap,
      ratePercent,
      rateLabel: def.rateLabel,
      uncalculable: current === null && required === null && gap === null && ratePercent === null,
    };
  });
}

/**
 * Carrega tudo que a tela de resultado precisa: o diagnóstico, a empresa,
 * o mapa de funil (Etapa 2, determinístico) e o relatório de IA mais
 * recente (Etapa 3). Nunca chama a IA — só lê o que já foi calculado e
 * persistido. Retorna um estado único e discriminado; a página só
 * precisa decidir o que renderizar a partir de `status`.
 */
export async function getCommercialPlanResult(diagnosticId: string): Promise<CommercialPlanResultState> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "not_found" };

  const [company, funnelAnalysis, report, seoAnalysis] = await Promise.all([
    companies.getCompanyById(diagnostic.company_id),
    funnelAnalyses.getFunnelAnalysis(diagnosticId),
    aiReports.getLatestReport(diagnosticId, "diagnostic_plan"),
    seoAnalyses.getLatestAnalysisForDiagnostic(diagnosticId),
  ]);

  const companyName = company?.company_name ?? "Sua empresa";

  if (!report) {
    return { status: "not_generated", diagnosticId, companyName };
  }

  if (report.status === "generating" && !isStale(report.created_at)) {
    return { status: "generating", diagnosticId, companyName };
  }

  if (report.status === "failed" || (report.status === "generating" && isStale(report.created_at))) {
    return {
      status: "failed",
      diagnosticId,
      companyName,
      reason: report.last_error,
      canRetry: true,
    };
  }

  const validated = CommercialPlanSchema.safeParse(report.response_json);
  if (!validated.success) {
    // Relatório marcado como "validated" no banco mas que não bate mais
    // com o schema atual (ex.: promptVersion mudou depois que foi salvo)
    // — trata como falha recuperável em vez de quebrar a página.
    console.error(
      "[get-commercial-plan-result] response_json salvo não bate com o schema atual:",
      validated.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    );
    return { status: "failed", diagnosticId, companyName, reason: "invalid_output", canRetry: true };
  }

  return {
    status: "completed",
    diagnosticId,
    companyName,
    generatedAt: report.created_at,
    plan: validated.data,
    funnelStages: buildFunnelStages(
      funnelAnalysis?.current_funnel,
      funnelAnalysis?.gaps,
      funnelAnalysis?.conversion_rates,
    ),
    primaryBottleneck: diagnostic.primary_bottleneck,
    secondaryRisk: diagnostic.secondary_risk,
    dataQualityPercentage: diagnostic.data_quality_percentage,
    confidence: diagnostic.confidence_level,
    seoOpportunities:
      seoAnalysis?.status === "completed" && Array.isArray(seoAnalysis.keyword_ideas)
        ? (seoAnalysis.keyword_ideas as KeywordOpportunity[])
        : [],
  };
}
