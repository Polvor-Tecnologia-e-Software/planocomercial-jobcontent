import { describe, expect, it } from "vitest";

import { InvalidSimulationInputError, simulateConversionChange } from "@/lib/calculations/simulation";

describe("simulateConversionChange", () => {
  it("calcula os dois cenários e o delta a partir dos valores fornecidos", () => {
    const result = simulateConversionChange({
      stage: "lead_to_opportunity",
      currentRate: 0.2,
      simulatedRate: 0.3,
      currentVolume: 100,
    });

    expect(result.currentScenario).toEqual({ rate: 0.2, volumeIn: 100, volumeOut: 20 });
    expect(result.simulatedScenario).toEqual({ rate: 0.3, volumeIn: 100, volumeOut: 30 });
    expect(result.delta.volumeOut).toBe(10);
    expect(result.delta.percentChange).toBe(50);
  });

  it("mantém o volume de entrada igual nos dois cenários — só a taxa muda", () => {
    const result = simulateConversionChange({
      stage: "proposal_to_sale",
      currentRate: 0.5,
      simulatedRate: 0.6,
      currentVolume: 40,
    });
    expect(result.variableChanged).toBe("rate");
    expect(result.valuesKept.volumeIn).toBe(40);
    expect(result.currentScenario.volumeIn).toBe(result.simulatedScenario.volumeIn);
  });

  it("percentChange é null quando o cenário atual não produz nenhuma saída (evita divisão por zero)", () => {
    const result = simulateConversionChange({
      stage: "meeting_to_proposal",
      currentRate: 0,
      simulatedRate: 0.4,
      currentVolume: 10,
    });
    expect(result.currentScenario.volumeOut).toBe(0);
    expect(result.delta.percentChange).toBeNull();
    expect(result.delta.volumeOut).toBe(4);
  });

  it("cenário extremo: taxa simulada igual à atual produz delta zero", () => {
    const result = simulateConversionChange({
      stage: "opportunity_to_meeting",
      currentRate: 0.35,
      simulatedRate: 0.35,
      currentVolume: 200,
    });
    expect(result.delta.volumeOut).toBe(0);
    expect(result.delta.percentChange).toBe(0);
  });

  it("cenário extremo: taxas nos limites 0 e 1 são aceitas", () => {
    expect(() =>
      simulateConversionChange({ stage: "lead_to_opportunity", currentRate: 0, simulatedRate: 1, currentVolume: 10 }),
    ).not.toThrow();
  });

  it("rejeita taxa fora de [0,1]", () => {
    expect(() =>
      simulateConversionChange({
        stage: "lead_to_opportunity",
        currentRate: 1.5,
        simulatedRate: 0.2,
        currentVolume: 10,
      }),
    ).toThrow(InvalidSimulationInputError);
  });

  it("rejeita volume negativo, NaN ou Infinity", () => {
    expect(() =>
      simulateConversionChange({ stage: "lead_to_opportunity", currentRate: 0.2, simulatedRate: 0.3, currentVolume: -5 }),
    ).toThrow(InvalidSimulationInputError);
    expect(() =>
      simulateConversionChange({
        stage: "lead_to_opportunity",
        currentRate: 0.2,
        simulatedRate: 0.3,
        currentVolume: Number.NaN,
      }),
    ).toThrow(InvalidSimulationInputError);
    expect(() =>
      simulateConversionChange({
        stage: "lead_to_opportunity",
        currentRate: 0.2,
        simulatedRate: 0.3,
        currentVolume: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(InvalidSimulationInputError);
  });

  it("não decide sozinha qual taxa simular — sempre usa exatamente os valores recebidos, mesmo que piorem o cenário", () => {
    const result = simulateConversionChange({
      stage: "proposal_to_sale",
      currentRate: 0.5,
      simulatedRate: 0.1,
      currentVolume: 100,
    });
    expect(result.simulatedScenario.volumeOut).toBe(10);
    expect(result.delta.volumeOut).toBe(-40);
  });
});
