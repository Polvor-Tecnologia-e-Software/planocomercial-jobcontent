import "server-only";

import { getApplicableRoute, toAnswerMap } from "@/lib/challenges/adaptive-engine";
import type {
  AIContext,
  AIContextAnswer,
  AIContextCandidateAction,
  AIContextFunnel,
  AIContextRate,
  AIContextScore,
  AIContextSignal,
} from "@/lib/ai/commercial-plan-prompt";
import {
  actionLibrary,
  companies,
  diagnosticAnswers,
  diagnosticScores,
  diagnosticSignals,
  diagnostics,
  funnelAnalyses,
} from "@/lib/database";
import type { Dimension } from "@/types/tables";

// ─── Leitura defensiva dos jsonb gravados pela etapa anterior (Etapa 2) ─────
// Nunca confiamos cegamente na forma de uma coluna jsonb: se algo vier
// diferente do esperado, o campo correspondente simplesmente fica ausente
// no AIContext em vez de quebrar a geração do plano.

function readRatePercent(raw: unknown): AIContextRate | null {
  if (!raw || typeof raw !== "object") return null;
  const value = (raw as Record<string, unknown>).value;
  const source = (raw as Record<string, unknown>).source;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (source !== "computed" && source !== "declared_bucket") return null;
  return { percent: Math.round(value * 100), source };
}

function readRequiredFunnelValue(raw: unknown, key: string): number | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function readGapValue(raw: unknown): number | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const stage = raw as Record<string, unknown>;
  if (stage.available !== true) return undefined;
  return typeof stage.gap === "number" ? stage.gap : undefined;
}

function buildFunnelContext(
  requiredFunnelRaw: unknown,
  gapsRaw: unknown,
  conversionRatesRaw: unknown,
  missingData: unknown,
): AIContextFunnel {
  const gaps = (gapsRaw ?? {}) as Record<string, unknown>;
  const rates = (conversionRatesRaw ?? {}) as Record<string, unknown>;

  return {
    requiredFunnel: {
      customers: readRequiredFunnelValue(requiredFunnelRaw, "requiredCustomers"),
      proposals: readRequiredFunnelValue(requiredFunnelRaw, "requiredProposals"),
      meetings: readRequiredFunnelValue(requiredFunnelRaw, "requiredMeetings"),
      opportunities: readRequiredFunnelValue(requiredFunnelRaw, "requiredOpportunities"),
      leads: readRequiredFunnelValue(requiredFunnelRaw, "requiredLeads"),
    },
    gaps: {
      customers: readGapValue(gaps.customers),
      proposals: readGapValue(gaps.proposals),
      meetings: readGapValue(gaps.meetings),
      opportunities: readGapValue(gaps.opportunities),
      leads: readGapValue(gaps.leads),
    },
    conversionRates: {
      leadToOpportunity: readRatePercent(rates.leadToOpportunity) ?? undefined,
      opportunityToMeeting: readRatePercent(rates.opportunityToMeeting) ?? undefined,
      meetingToProposal: readRatePercent(rates.meetingToProposal) ?? undefined,
      proposalToSale: readRatePercent(rates.proposalToSale) ?? undefined,
    },
    missingData: Array.isArray(missingData) ? missingData.filter((item): item is string => typeof item === "string") : [],
  };
}

/**
 * Monta o AIContext compacto para a geração do plano comercial — nunca
 * envia HTML, texto integral de site, IDs internos, timestamps ou
 * respostas fora do contexto do desafio selecionado. Retorna null se o
 * diagnóstico não existir ou ainda não tiver desafio selecionado (não
 * deveria ser chamado nesse caso).
 */
export async function buildCommercialPlanContext(diagnosticId: string): Promise<AIContext | null> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic || !diagnostic.selected_challenge) return null;

  const [company, answerRows, funnelAnalysis, scoreRows, signalRows] = await Promise.all([
    companies.getCompanyById(diagnostic.company_id),
    diagnosticAnswers.listAnswers(diagnosticId),
    funnelAnalyses.getFunnelAnalysis(diagnosticId),
    diagnosticScores.listScores(diagnosticId),
    diagnosticSignals.listSignals(diagnosticId),
  ]);

  // Só as perguntas atualmente aplicáveis ao desafio escolhido, e só as
  // que de fato têm resposta — nunca respostas órfãs de uma pergunta que
  // saiu da rota, nunca de outro desafio.
  const answerMap = toAnswerMap(answerRows);
  const applicableRoute = getApplicableRoute(diagnostic.selected_challenge, answerMap);
  const relevantAnswers: AIContextAnswer[] = applicableRoute
    .filter((item) => answerMap[item.key] !== undefined)
    .map((item) => ({
      questionKey: item.key,
      prompt: item.question.prompt,
      answer: String(answerMap[item.key]),
    }));

  const scores: AIContextScore[] = scoreRows.map((row) => ({
    dimension: row.dimension,
    score: row.score,
    hasData: row.weight > 0,
  }));

  // Sinais sem dimensão gravada (não deveria acontecer — todas as regras
  // de src/lib/calculations/signals.ts sempre atribuem uma) são
  // descartados em vez de receber uma dimensão adivinhada.
  const signals: AIContextSignal[] = signalRows
    .filter((row): row is typeof row & { dimension: Dimension } => row.dimension !== null)
    .map((row) => ({ code: row.signal_code, dimension: row.dimension, severity: row.severity }));

  const bottleneckDimensions = [diagnostic.primary_bottleneck, diagnostic.secondary_risk].filter(
    (dimension): dimension is Dimension => dimension !== null,
  );
  const candidateActionRows =
    bottleneckDimensions.length > 0
      ? (await Promise.all(bottleneckDimensions.map((dimension) => actionLibrary.listActiveActionsByDimension(dimension)))).flat()
      : [];
  const candidateActions: AIContextCandidateAction[] = candidateActionRows.map((row) => ({
    actionCode: row.action_code,
    title: row.title,
    defaultPhase: row.default_phase,
    defaultOwner: row.default_owner,
    defaultIndicator: row.default_indicator,
  }));

  return {
    company: company
      ? {
          name: company.company_name,
          segment: company.segment,
          mainOffer: company.main_offer,
          targetAudience: company.target_audience,
          businessModel: company.business_model,
          differentiators: Array.isArray(company.differentiators)
            ? (company.differentiators as unknown[]).filter((item): item is string => typeof item === "string")
            : [],
          commercialProofs: Array.isArray(company.commercial_proofs)
            ? (company.commercial_proofs as unknown[]).filter((item): item is string => typeof item === "string")
            : [],
        }
      : null,
    selectedChallenge: diagnostic.selected_challenge,
    relevantAnswers,
    funnelAnalysis: buildFunnelContext(
      funnelAnalysis?.required_funnel,
      funnelAnalysis?.gaps,
      funnelAnalysis?.conversion_rates,
      funnelAnalysis?.missing_data,
    ),
    primaryBottleneckCandidate: diagnostic.primary_bottleneck,
    secondaryRiskCandidate: diagnostic.secondary_risk,
    signals,
    dataQuality: {
      percentage: diagnostic.data_quality_percentage ?? 0,
      confidence: diagnostic.confidence_level ?? "low",
    },
    scores,
    candidateActions,
  };
}
