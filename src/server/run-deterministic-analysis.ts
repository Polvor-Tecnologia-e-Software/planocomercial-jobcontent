import "server-only";

import { toAnswerMap } from "@/lib/challenges/adaptive-engine";
import { ALL_DIMENSIONS } from "@/lib/calculations/config";
import { runDeterministicCalculations } from "@/lib/calculations";
import type { DeterministicAnalysisResult } from "@/lib/calculations/types";
import {
  diagnosticAnswers,
  diagnosticSignals,
  diagnosticScores,
  diagnostics,
  funnelAnalyses,
} from "@/lib/database";
import type { DiagnosticRow } from "@/types/tables";

export type RunDeterministicAnalysisResult =
  | { status: "skipped"; reason: "diagnostic_not_found" | "challenge_not_selected" }
  | { status: "completed"; diagnostic: DiagnosticRow; analysis: DeterministicAnalysisResult };

/**
 * Executa o motor determinístico (score, sinais, gargalo, engenharia
 * reversa) para um diagnóstico e persiste o resultado nas tabelas já
 * existentes (diagnostics, diagnostic_scores, diagnostic_signals,
 * funnel_analyses). Nunca chama IA. Sempre lê diagnostic_answers do
 * PRÓPRIO diagnosticId informado — nunca mistura dados de outro
 * diagnóstico.
 *
 * Seguro para rodar mais de uma vez para o mesmo diagnóstico: todas as
 * gravações são upsert/replace (diagnostic_scores por dimensão,
 * funnel_analyses por diagnóstico, diagnostic_signals via replaceSignals),
 * então recalcular apenas sobrescreve com o resultado mais atual — nunca
 * duplica linhas.
 */
export async function runDeterministicAnalysis(
  diagnosticId: string,
): Promise<RunDeterministicAnalysisResult> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "skipped", reason: "diagnostic_not_found" };
  if (!diagnostic.selected_challenge) return { status: "skipped", reason: "challenge_not_selected" };

  const answerRows = await diagnosticAnswers.listAnswers(diagnosticId);
  const answers = toAnswerMap(answerRows);

  const analysis = runDeterministicCalculations(answers, diagnostic.selected_challenge);

  await Promise.all([
    ...ALL_DIMENSIONS.map((dimension) =>
      diagnosticScores.upsertScore({
        diagnostic_id: diagnosticId,
        dimension,
        score: analysis.score.dimensions[dimension].score,
        weight: analysis.score.dimensions[dimension].weight,
        evidence: analysis.score.dimensions[dimension].evidence,
      }),
    ),
    diagnosticSignals.replaceSignals(
      diagnosticId,
      analysis.signals.map((signal) => ({
        diagnostic_id: diagnosticId,
        signal_code: signal.code,
        dimension: signal.dimension,
        severity: signal.severity,
        evidence: signal.evidence,
      })),
    ),
    funnelAnalyses.upsertFunnelAnalysis({
      diagnostic_id: diagnosticId,
      current_funnel: {
        leadsPerMonth: analysis.metrics.leadsPerMonth,
        opportunitiesPerMonth: analysis.metrics.opportunitiesPerMonth,
        meetingsPerMonth: analysis.metrics.meetingsPerMonth,
        proposalsPerMonth: analysis.metrics.proposalsPerMonth,
        salesPerMonth: analysis.metrics.salesPerMonth,
        currentMonthlySales: analysis.metrics.currentMonthlySales,
        currentMonthlyRevenue: analysis.metrics.currentMonthlyRevenue,
      },
      required_funnel: {
        requiredCustomers: analysis.reverseEngineering.requiredCustomers,
        requiredProposals: analysis.reverseEngineering.requiredProposals,
        requiredMeetings: analysis.reverseEngineering.requiredMeetings,
        requiredOpportunities: analysis.reverseEngineering.requiredOpportunities,
        requiredLeads: analysis.reverseEngineering.requiredLeads,
      },
      conversion_rates: {
        leadToOpportunity: analysis.rates.leadToOpportunity,
        opportunityToMeeting: analysis.rates.opportunityToMeeting,
        meetingToProposal: analysis.rates.meetingToProposal,
        proposalToSale: analysis.rates.proposalToSale,
      },
      gaps: analysis.gaps,
      assumptions: analysis.reverseEngineering.assumptions,
      missing_data: analysis.reverseEngineering.missingData,
      completeness_percentage: analysis.funnelCompletenessPercentage,
    }),
    diagnostics.updateDiagnostic(diagnosticId, {
      overall_score: analysis.score.overallScore,
      primary_bottleneck: analysis.bottleneck.primaryBottleneckCandidate,
      secondary_risk: analysis.bottleneck.secondaryRiskCandidate,
      data_quality_percentage: analysis.dataQuality.dataQualityPercentage,
      confidence_level: analysis.dataQuality.confidence,
    }),
  ]);

  const updatedDiagnostic = await diagnostics.getDiagnosticById(diagnosticId);

  return { status: "completed", diagnostic: updatedDiagnostic ?? diagnostic, analysis };
}
