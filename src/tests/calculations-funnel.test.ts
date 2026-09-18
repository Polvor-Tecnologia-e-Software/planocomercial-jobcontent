import { describe, expect, it } from "vitest";

import { extractCommercialMetrics } from "@/lib/calculations/normalize-metrics";
import { computeConversionRates, computeRateFromCounts } from "@/lib/calculations/rates";
import {
  computeFunnelCompletenessPercentage,
  computeGoalReverseEngineering,
} from "@/lib/calculations/reverse-engineering";
import { computeFunnelGaps } from "@/lib/calculations/gaps";
import { isValidFiniteNonNegative, toSaneNumberOrNull } from "@/lib/calculations/rounding";
import type { CommercialMetrics, ConversionRates } from "@/lib/calculations/types";

function emptyMetrics(overrides: Partial<CommercialMetrics> = {}): CommercialMetrics {
  return {
    averageTicket: null,
    salesCycleDays: null,
    teamSize: null,
    monthlyGoal: null,
    currentMonthlySales: null,
    currentMonthlyRevenue: null,
    opportunitiesPerMonth: null,
    meetingsPerMonth: null,
    proposalsPerMonth: null,
    salesPerMonth: null,
    leadsPerMonth: null,
    proposalStallDays: null,
    declaredLeadToOpportunityRate: null,
    ...overrides,
  };
}

const EMPTY_RATES: ConversionRates = {
  leadToOpportunity: null,
  opportunityToMeeting: null,
  meetingToProposal: null,
  proposalToSale: null,
};

// ─── 1. Normalização ────────────────────────────────────────────────────────
describe("extractCommercialMetrics", () => {
  it("lê as perguntas universais independente do desafio", () => {
    const metrics = extractCommercialMetrics({ U1: 5000, U2: 30, U3: 4 }, "D4");
    expect(metrics.averageTicket).toBe(5000);
    expect(metrics.salesCycleDays).toBe(30);
    expect(metrics.teamSize).toBe(4);
  });

  it("lê U6 (leadsPerMonth) independente do desafio selecionado — pergunta universal", () => {
    expect(extractCommercialMetrics({ U6: 80 }, "D1").leadsPerMonth).toBe(80);
    expect(extractCommercialMetrics({ U6: 80 }, "D2").leadsPerMonth).toBe(80);
    expect(extractCommercialMetrics({ U6: 80 }, null).leadsPerMonth).toBe(80);
  });

  it("converte a faixa autodeclarada de D2_Q2 num ponto médio, só quando D2 é o desafio", () => {
    expect(extractCommercialMetrics({ D2_Q2: "10_30" }, "D2").declaredLeadToOpportunityRate).toEqual({
      value: 0.2,
      source: "declared_bucket",
    });
    expect(extractCommercialMetrics({ D2_Q2: "10_30" }, "D1").declaredLeadToOpportunityRate).toBeNull();
  });

  it("'não sei' em D2_Q2 não vira taxa — incerteza não é dado", () => {
    expect(extractCommercialMetrics({ D2_Q2: "nao_sei" }, "D2").declaredLeadToOpportunityRate).toBeNull();
  });

  it("lê monthlyGoal (U4) e currentMonthlySales/salesPerMonth (U5, mesma resposta para os dois campos)", () => {
    const metrics = extractCommercialMetrics({ U1: 1000, U4: 100_000, U5: 12 }, "D1");
    expect(metrics.monthlyGoal).toBe(100_000);
    expect(metrics.currentMonthlySales).toBe(12);
    expect(metrics.salesPerMonth).toBe(12);
  });

  it("lê currentMonthlyRevenue (U10) independente do desafio — pergunta universal e opcional", () => {
    expect(extractCommercialMetrics({ U10: 60_000 }, "D1").currentMonthlyRevenue).toBe(60_000);
    expect(extractCommercialMetrics({}, "D1").currentMonthlyRevenue).toBeNull();
  });

  it("lê o volume de cada etapa do funil (U7, U8, U9) independente do desafio", () => {
    const metrics = extractCommercialMetrics({ U7: 20, U8: 15, U9: 10 }, "D4");
    expect(metrics.opportunitiesPerMonth).toBe(20);
    expect(metrics.meetingsPerMonth).toBe(15);
    expect(metrics.proposalsPerMonth).toBe(10);
  });
});

// ─── Validação numérica ──────────────────────────────────────────────────────
describe("toSaneNumberOrNull / isValidFiniteNonNegative — cenários extremos", () => {
  it("aceita números finitos não-negativos", () => {
    expect(toSaneNumberOrNull(100)).toBe(100);
    expect(toSaneNumberOrNull("250")).toBe(250);
    expect(toSaneNumberOrNull(0)).toBe(0);
  });

  it("rejeita negativos, NaN, Infinity e valores absurdos", () => {
    expect(toSaneNumberOrNull(-1)).toBeNull();
    expect(toSaneNumberOrNull(Number.NaN)).toBeNull();
    expect(toSaneNumberOrNull(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toSaneNumberOrNull(Number.NEGATIVE_INFINITY)).toBeNull();
    expect(toSaneNumberOrNull(1_000_000_001)).toBeNull(); // meta "absurda"
    expect(isValidFiniteNonNegative("não é número")).toBe(false);
  });

  it("ausência/null vira null, não zero", () => {
    expect(toSaneNumberOrNull(undefined)).toBeNull();
    expect(toSaneNumberOrNull(null)).toBeNull();
  });
});

// ─── 2. Taxas ────────────────────────────────────────────────────────────────
describe("computeRateFromCounts", () => {
  it("calcula a taxa quando ambas as contagens existem", () => {
    expect(computeRateFromCounts(20, 100)).toEqual({ value: 0.2, source: "computed" });
  });

  it("taxa zero (numerador 0) é uma taxa válida, não dado ausente", () => {
    expect(computeRateFromCounts(0, 100)).toEqual({ value: 0, source: "computed" });
  });

  it("denominador zero nunca divide — retorna null, não Infinity", () => {
    expect(computeRateFromCounts(10, 0)).toBeNull();
  });

  it("dado ausente (null) em qualquer lado retorna null, nunca uma taxa inventada", () => {
    expect(computeRateFromCounts(null, 100)).toBeNull();
    expect(computeRateFromCounts(10, null)).toBeNull();
  });

  it("numerador > denominador vira uma taxa > 100%, não é rejeitado — comum em estágios como reuniões por oportunidade (várias reuniões para uma mesma oportunidade)", () => {
    expect(computeRateFromCounts(150, 100)).toEqual({ value: 1.5, source: "computed" });
  });
});

describe("computeConversionRates", () => {
  it("prefere a taxa calculada por contagens quando ambas as pontas existem", () => {
    const metrics = emptyMetrics({
      opportunitiesPerMonth: 20,
      leadsPerMonth: 100,
      declaredLeadToOpportunityRate: { value: 0.99, source: "declared_bucket" },
    });
    expect(computeConversionRates(metrics).leadToOpportunity).toEqual({ value: 0.2, source: "computed" });
  });

  it("cai para a taxa autodeclarada quando não há contagens", () => {
    const metrics = emptyMetrics({ declaredLeadToOpportunityRate: { value: 0.2, source: "declared_bucket" } });
    expect(computeConversionRates(metrics).leadToOpportunity).toEqual({ value: 0.2, source: "declared_bucket" });
  });

  it("as outras três taxas ficam null quando não há contagens de estágios adjacentes (estado real do catálogo hoje)", () => {
    const rates = computeConversionRates(emptyMetrics());
    expect(rates.opportunityToMeeting).toBeNull();
    expect(rates.meetingToProposal).toBeNull();
    expect(rates.proposalToSale).toBeNull();
  });
});

// ─── 3. Engenharia reversa da meta ───────────────────────────────────────────
describe("computeGoalReverseEngineering", () => {
  it("funil completo: todas as taxas disponíveis produz a cadeia inteira, com arredondamento para cima", () => {
    const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000, currentMonthlySales: 3 });
    const rates: ConversionRates = {
      proposalToSale: { value: 0.5, source: "computed" },
      meetingToProposal: { value: 0.4, source: "computed" },
      opportunityToMeeting: { value: 0.5, source: "computed" },
      leadToOpportunity: { value: 0.2, source: "computed" },
    };

    const result = computeGoalReverseEngineering(metrics, rates);

    expect(result.requiredCustomers).toBe(10); // ceil(100000/10000)
    expect(result.currentCustomerGap).toBe(7); // max(10-3, 0)
    expect(result.requiredProposals).toBe(20); // ceil(10/0.5)
    expect(result.requiredMeetings).toBe(50); // ceil(20/0.4)
    expect(result.requiredOpportunities).toBe(100); // ceil(50/0.5)
    expect(result.requiredLeads).toBe(500); // ceil(100/0.2)
    expect(result.missingData).toEqual([]);
  });

  it("arredondamento para cima: 3.01 clientes necessários vira 4, nunca 3", () => {
    const metrics = emptyMetrics({ monthlyGoal: 30_100, averageTicket: 10_000 });
    const result = computeGoalReverseEngineering(metrics, EMPTY_RATES);
    expect(result.requiredCustomers).toBe(4);
  });

  it("funil parcial: para no primeiro degrau ausente e preserva o que já foi calculado (exemplo do pedido)", () => {
    const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000 });
    const rates: ConversionRates = { ...EMPTY_RATES, proposalToSale: { value: 0.5, source: "computed" } };

    const result = computeGoalReverseEngineering(metrics, rates);

    expect(result.requiredCustomers).toBe(10);
    expect(result.requiredProposals).toBe(20);
    expect(result.requiredMeetings).toBeNull();
    expect(result.requiredOpportunities).toBeNull();
    expect(result.requiredLeads).toBeNull();
    expect(result.missingData).toContain("meetingToProposalRate");
  });

  it("meta ausente interrompe tudo e registra em missingData, sem inventar nada", () => {
    const result = computeGoalReverseEngineering(emptyMetrics({ averageTicket: 1000 }), EMPTY_RATES);
    expect(result.requiredCustomers).toBeNull();
    expect(result.missingData).toContain("monthlyGoal");
  });

  it("ticket zero é tratado como dado inválido, nunca divide por zero", () => {
    const result = computeGoalReverseEngineering(
      emptyMetrics({ monthlyGoal: 10_000, averageTicket: 0 }),
      EMPTY_RATES,
    );
    expect(result.requiredCustomers).toBeNull();
    expect(result.missingData).toContain("averageTicket_invalid");
  });

  it("continua a cadeia mesmo quando uma taxa intermediária é > 100% (caso real: mais reuniões do que oportunidades por mês)", () => {
    // Reproduz um caso real reportado: 20 leads, 2 oportunidades, 5 reuniões,
    // 5 propostas, 2 vendas por mês — opportunityToMeeting = 5/2 = 2.5 (250%).
    // Antes da correção, essa taxa virava null e a cadeia parava ali,
    // deixando Oportunidades e Leads necessários sempre "—".
    const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000, currentMonthlySales: 2 });
    const rates: ConversionRates = {
      proposalToSale: { value: 0.4, source: "computed" },
      meetingToProposal: { value: 1, source: "computed" },
      opportunityToMeeting: { value: 2.5, source: "computed" },
      leadToOpportunity: { value: 0.1, source: "computed" },
    };

    const result = computeGoalReverseEngineering(metrics, rates);

    expect(result.requiredOpportunities).not.toBeNull();
    expect(result.requiredLeads).not.toBeNull();
    expect(result.missingData).toEqual([]);
  });

  describe("currentMonthlyRevenue (U10) — desconta faturamento já existente da meta", () => {
    it("sem currentMonthlyRevenue, requiredCustomers trata a meta como se a empresa partisse de R$0 (comportamento antigo) e registra a premissa", () => {
      const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000 });
      const result = computeGoalReverseEngineering(metrics, EMPTY_RATES);

      expect(result.requiredCustomers).toBe(10);
      expect(result.assumptions).toContain(
        "Faturamento atual (U10) não informado — a meta foi tratada como se a empresa partisse de R$0, o que pode inflar os números necessários se já existir faturamento recorrente.",
      );
    });

    it("com currentMonthlyRevenue, requiredCustomers usa o GAP de receita (meta - faturamento atual), não a meta inteira", () => {
      const metrics = emptyMetrics({
        monthlyGoal: 100_000,
        averageTicket: 10_000,
        currentMonthlyRevenue: 60_000,
      });
      const result = computeGoalReverseEngineering(metrics, EMPTY_RATES);

      expect(result.requiredCustomers).toBe(4); // ceil((100000-60000)/10000)
      expect(result.assumptions.some((a) => a.includes("Faturamento atual (U10) não informado"))).toBe(
        false,
      );
    });

    it("faturamento atual igual ou maior que a meta zera requiredCustomers, nunca fica negativo", () => {
      const metrics = emptyMetrics({
        monthlyGoal: 50_000,
        averageTicket: 10_000,
        currentMonthlyRevenue: 80_000,
      });
      const result = computeGoalReverseEngineering(metrics, EMPTY_RATES);

      expect(result.requiredCustomers).toBe(0);
    });
  });

  it("marca como premissa quando uma taxa usada veio de uma faixa autodeclarada", () => {
    const metrics = emptyMetrics({ monthlyGoal: 10_000, averageTicket: 1000 });
    const rates: ConversionRates = {
      ...EMPTY_RATES,
      proposalToSale: { value: 0.5, source: "declared_bucket" },
    };
    const result = computeGoalReverseEngineering(metrics, rates);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });
});

describe("computeFunnelCompletenessPercentage", () => {
  it("0% quando nada foi calculado, 100% quando os 5 estágios foram", () => {
    const empty = computeGoalReverseEngineering(emptyMetrics(), EMPTY_RATES);
    expect(computeFunnelCompletenessPercentage(empty)).toBe(0);

    const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000 });
    const rates: ConversionRates = {
      proposalToSale: { value: 0.5, source: "computed" },
      meetingToProposal: { value: 0.4, source: "computed" },
      opportunityToMeeting: { value: 0.5, source: "computed" },
      leadToOpportunity: { value: 0.2, source: "computed" },
    };
    const full = computeGoalReverseEngineering(metrics, rates);
    expect(computeFunnelCompletenessPercentage(full)).toBe(100);
  });

  it("percentual intermediário quando a cadeia para no meio", () => {
    const metrics = emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000 });
    const rates: ConversionRates = { ...EMPTY_RATES, proposalToSale: { value: 0.5, source: "computed" } };
    const partial = computeGoalReverseEngineering(metrics, rates);
    expect(computeFunnelCompletenessPercentage(partial)).toBe(40); // 2 de 5 estágios
  });
});

// ─── 4. Gaps ─────────────────────────────────────────────────────────────────
describe("computeFunnelGaps", () => {
  it("gap = required - current quando ambos existem", () => {
    const metrics = emptyMetrics({ currentMonthlySales: 3 });
    const reverseEngineering = computeGoalReverseEngineering(
      emptyMetrics({ monthlyGoal: 100_000, averageTicket: 10_000, currentMonthlySales: 3 }),
      EMPTY_RATES,
    );
    const gaps = computeFunnelGaps(metrics, reverseEngineering);
    expect(gaps.customers).toEqual({ available: true, required: 10, current: 3, gap: 7 });
  });

  it("nunca retorna gap negativo — clampa em 0 quando current já supera required", () => {
    const reverseEngineering = computeGoalReverseEngineering(
      emptyMetrics({ monthlyGoal: 10_000, averageTicket: 10_000, currentMonthlySales: 50 }),
      EMPTY_RATES,
    );
    const gaps = computeFunnelGaps(emptyMetrics({ currentMonthlySales: 50 }), reverseEngineering);
    expect(gaps.customers).toEqual({ available: true, required: 1, current: 50, gap: 0 });
  });

  it("estágio fica indisponível (nunca um gap inventado) quando required ou current faltam", () => {
    const reverseEngineering = computeGoalReverseEngineering(emptyMetrics(), EMPTY_RATES);
    const gaps = computeFunnelGaps(emptyMetrics(), reverseEngineering);
    expect(gaps.customers).toEqual({ available: false });
    expect(gaps.leads).toEqual({ available: false });
  });
});
