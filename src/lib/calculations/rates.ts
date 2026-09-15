/**
 * Seção 2: taxas de conversão entre estágios do funil.
 *
 * leadToOpportunityRate = opportunities / leads
 * opportunityToMeetingRate = meetings / opportunities
 * meetingToProposalRate = proposals / meetings
 * proposalToSaleRate = sales / proposals
 *
 * Regras: nunca dividir por zero; zero e "dado ausente" são coisas
 * diferentes (uma contagem 0 é um valor válido — a taxa fica null quando
 * o dado simplesmente não existe, não quando ele é zero); nunca inventar
 * taxa; nunca aplicar benchmark oculto.
 *
 * Quando existem contagens reais para as duas pontas de um estágio, a
 * taxa é CALCULADA a partir delas (preferida — fonte "computed"). Desde a
 * expansão do catálogo universal (U6-U9: leads/oportunidades/reuniões/
 * propostas por mês, perguntadas em todo diagnóstico), isso é o caminho
 * comum, não mais a exceção — qualquer uma dessas quatro contagens pode
 * ficar null se a pessoa respondeu "não sei" a uma pergunta específica,
 * o que interrompe a cadeia de engenharia reversa (ver reverse-engineering.ts)
 * a partir dali. Para lead->oportunidade especificamente, quando a
 * contagem não existe mas a pessoa declarou a taxa diretamente (D2_Q2,
 * uma faixa autodeclarada), essa é usada como alternativa — nunca as duas
 * ao mesmo tempo, e sempre com a proveniência marcada (RateValue.source).
 */
import { isValidRate } from "@/lib/calculations/rounding";
import type { CommercialMetrics, ConversionRates, RateValue } from "@/lib/calculations/types";

/**
 * Calcula numerator/denominator quando ambos existem e o denominador é
 * positivo. Retorna null (não zero, não uma taxa inventada) quando
 * qualquer um dos dois está ausente, ou quando o denominador é zero
 * (divisão por zero — zero volume não produz "0% de taxa", produz "taxa
 * indefinida"). Um resultado acima de 1 (100%) é aceito — ver
 * isValidRate em rounding.ts para o porquê (ex.: mais reuniões do que
 * oportunidades por mês é comum, não é dado inconsistente).
 */
export function computeRateFromCounts(
  numerator: number | null,
  denominator: number | null,
): RateValue | null {
  if (numerator === null || denominator === null) return null;
  if (denominator <= 0) return null;

  const value = numerator / denominator;
  if (!isValidRate(value)) return null;

  return { value, source: "computed" };
}

export function computeConversionRates(metrics: CommercialMetrics): ConversionRates {
  return {
    leadToOpportunity:
      computeRateFromCounts(metrics.opportunitiesPerMonth, metrics.leadsPerMonth) ??
      metrics.declaredLeadToOpportunityRate,
    opportunityToMeeting: computeRateFromCounts(metrics.meetingsPerMonth, metrics.opportunitiesPerMonth),
    meetingToProposal: computeRateFromCounts(metrics.proposalsPerMonth, metrics.meetingsPerMonth),
    proposalToSale: computeRateFromCounts(metrics.salesPerMonth, metrics.proposalsPerMonth),
  };
}
