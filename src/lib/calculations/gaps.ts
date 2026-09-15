/**
 * Seção 4: gaps do funil — required - current, para clientes, propostas,
 * reuniões, oportunidades e leads. Nunca negativo (clamp em 0). Só
 * calculado quando os dois lados existem — ausência de qualquer um dos
 * dois marca o estágio como indisponível (available: false), nunca um gap
 * inventado.
 */
import type { CommercialMetrics, FunnelGaps, ReverseEngineeringResult, StageGap } from "@/lib/calculations/types";

function stageGap(required: number | null, current: number | null): StageGap {
  if (required === null || current === null) return { available: false };
  return { available: true, required, current, gap: Math.max(required - current, 0) };
}

export function computeFunnelGaps(
  metrics: CommercialMetrics,
  reverseEngineering: ReverseEngineeringResult,
): FunnelGaps {
  return {
    customers: stageGap(reverseEngineering.requiredCustomers, metrics.currentMonthlySales),
    proposals: stageGap(reverseEngineering.requiredProposals, metrics.proposalsPerMonth),
    meetings: stageGap(reverseEngineering.requiredMeetings, metrics.meetingsPerMonth),
    opportunities: stageGap(reverseEngineering.requiredOpportunities, metrics.opportunitiesPerMonth),
    leads: stageGap(reverseEngineering.requiredLeads, metrics.leadsPerMonth),
  };
}
