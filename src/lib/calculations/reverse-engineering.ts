/**
 * Seção 3: engenharia reversa da meta.
 *
 * requiredCustomers = ceil(monthlyGoal / averageTicket)
 * currentCustomerGap = max(requiredCustomers - currentMonthlySales, 0)
 * requiredProposals = ceil(requiredCustomers / proposalToSaleRate)
 * requiredMeetings = ceil(requiredProposals / meetingToProposalRate)
 * requiredOpportunities = ceil(requiredMeetings / opportunityToMeetingRate)
 * requiredLeads = ceil(requiredOpportunities / leadToOpportunityRate)
 *
 * A cadeia é sequencial: se uma taxa estiver ausente, a engenharia reversa
 * PARA naquele degrau — os valores já calculados (mais próximos da meta)
 * são mantidos, os de cima ficam null, e o nome do dado que faltou é
 * registrado em missingData. Nunca completa com benchmark. Exemplo do
 * pedido original:
 *
 *   Clientes necessários: 10
 *   Propostas necessárias: 20
 *   Reuniões necessárias: ainda não calculável (meetingToProposalRate ausente)
 *   Oportunidades: ainda não calculável
 *   Leads: ainda não calculável
 */
import { roundUpToInt } from "@/lib/calculations/rounding";
import type { ConversionRates, ReverseEngineeringResult } from "@/lib/calculations/types";
import type { CommercialMetrics } from "@/lib/calculations/types";

const EMPTY: Omit<ReverseEngineeringResult, "missingData" | "assumptions"> = {
  requiredCustomers: null,
  currentCustomerGap: null,
  requiredProposals: null,
  requiredMeetings: null,
  requiredOpportunities: null,
  requiredLeads: null,
};

export function computeGoalReverseEngineering(
  metrics: CommercialMetrics,
  rates: ConversionRates,
): ReverseEngineeringResult {
  const missingData: string[] = [];
  const assumptions: string[] = [];

  if (metrics.monthlyGoal === null) missingData.push("monthlyGoal");
  if (metrics.averageTicket === null) missingData.push("averageTicket");
  else if (metrics.averageTicket <= 0) missingData.push("averageTicket_invalid");

  if (
    metrics.monthlyGoal === null ||
    metrics.averageTicket === null ||
    metrics.averageTicket <= 0
  ) {
    return { ...EMPTY, missingData, assumptions };
  }

  const requiredCustomers = roundUpToInt(metrics.monthlyGoal / metrics.averageTicket);

  let currentCustomerGap: number | null = null;
  if (metrics.currentMonthlySales === null) {
    missingData.push("currentMonthlySales");
  } else {
    currentCustomerGap = Math.max(requiredCustomers - metrics.currentMonthlySales, 0);
  }

  if (!rates.proposalToSale) {
    missingData.push("proposalToSaleRate");
    return { ...EMPTY, requiredCustomers, currentCustomerGap, missingData, assumptions };
  }
  if (rates.proposalToSale.source === "declared_bucket") {
    assumptions.push("proposalToSaleRate estimada a partir de uma faixa autodeclarada, não medida.");
  }
  const requiredProposals = roundUpToInt(requiredCustomers / rates.proposalToSale.value);

  if (!rates.meetingToProposal) {
    missingData.push("meetingToProposalRate");
    return {
      ...EMPTY,
      requiredCustomers,
      currentCustomerGap,
      requiredProposals,
      missingData,
      assumptions,
    };
  }
  if (rates.meetingToProposal.source === "declared_bucket") {
    assumptions.push("meetingToProposalRate estimada a partir de uma faixa autodeclarada, não medida.");
  }
  const requiredMeetings = roundUpToInt(requiredProposals / rates.meetingToProposal.value);

  if (!rates.opportunityToMeeting) {
    missingData.push("opportunityToMeetingRate");
    return {
      ...EMPTY,
      requiredCustomers,
      currentCustomerGap,
      requiredProposals,
      requiredMeetings,
      missingData,
      assumptions,
    };
  }
  if (rates.opportunityToMeeting.source === "declared_bucket") {
    assumptions.push("opportunityToMeetingRate estimada a partir de uma faixa autodeclarada, não medida.");
  }
  const requiredOpportunities = roundUpToInt(requiredMeetings / rates.opportunityToMeeting.value);

  if (!rates.leadToOpportunity) {
    missingData.push("leadToOpportunityRate");
    return {
      ...EMPTY,
      requiredCustomers,
      currentCustomerGap,
      requiredProposals,
      requiredMeetings,
      requiredOpportunities,
      missingData,
      assumptions,
    };
  }
  if (rates.leadToOpportunity.source === "declared_bucket") {
    assumptions.push("leadToOpportunityRate estimada a partir de uma faixa autodeclarada, não medida.");
  }
  const requiredLeads = roundUpToInt(requiredOpportunities / rates.leadToOpportunity.value);

  return {
    requiredCustomers,
    currentCustomerGap,
    requiredProposals,
    requiredMeetings,
    requiredOpportunities,
    requiredLeads,
    missingData,
    assumptions,
  };
}

/**
 * Completude do funil (usada como um dos fatores da qualidade de dados,
 * seção 6): quantos dos 5 estágios da engenharia reversa (clientes,
 * propostas, reuniões, oportunidades, leads necessários) puderam ser
 * calculados, de 0 a 100. Diferente de dataQualityPercentage — mede o
 * quão longe a cadeia de cálculo chegou, não o quanto do questionário foi
 * respondido.
 */
export function computeFunnelCompletenessPercentage(result: ReverseEngineeringResult): number {
  const stages = [
    result.requiredCustomers,
    result.requiredProposals,
    result.requiredMeetings,
    result.requiredOpportunities,
    result.requiredLeads,
  ];
  const known = stages.filter((stage) => stage !== null).length;
  return Math.round((known / stages.length) * 100);
}
