import { describe, expect, it } from "vitest";

import { computeDataQuality } from "@/lib/calculations/data-quality";
import type { AnswerMap } from "@/lib/challenges/adaptive-engine";

describe("computeDataQuality", () => {
  it("0% e confiança baixa quando não há desafio selecionado ainda", () => {
    const result = computeDataQuality({}, null);
    expect(result.dataQualityPercentage).toBe(0);
    expect(result.confidence).toBe("low");
  });

  it("0% quando nada foi respondido", () => {
    const result = computeDataQuality({}, "D1");
    expect(result.dataQualityPercentage).toBe(0);
    expect(result.answeredCount).toBe(0);
  });

  it("aumenta a completude conforme mais perguntas aplicáveis são respondidas", () => {
    const partial: AnswerMap = { U1: 1000, U2: 30, U3: 2 };
    const full: AnswerMap = { ...partial, D1_Q1: "outbound", U6: 50 };

    const partialResult = computeDataQuality(partial, "D1");
    const fullResult = computeDataQuality(full, "D1");

    expect(fullResult.dataQualityPercentage).toBeGreaterThan(partialResult.dataQualityPercentage);
  });

  it("respostas 'não sei'/'não sabemos' contam como respondidas mas reduzem a certeza (não a completude)", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "nao_sei" };
    const result = computeDataQuality(answers, "D1");

    expect(result.answeredCount).toBe(4);
    expect(result.uncertainCount).toBe(1);
  });

  it("qualidade de dados alta não implica maturidade alta — mede completude do insumo, não saúde comercial", () => {
    // Todas as perguntas de D4 respondidas, mas com as piores opções
    // (playbook inexistente, impacto grave) — dado completo e certo,
    // mesmo que o diagnóstico em si seja ruim.
    const answers: AnswerMap = {
      U1: 1000,
      U2: 30,
      U3: 2,
      D4_Q1: "nao",
      D4_Q2: "impacto_grave",
      D4_Q3: "processo manual demais",
    };
    const result = computeDataQuality(answers, "D4");
    expect(result.uncertainCount).toBe(0);
    expect(result.dataQualityPercentage).toBeGreaterThan(0);
  });

  it("respeita as faixas de confiança configuradas (alta/média/baixa)", () => {
    const empty = computeDataQuality({}, "D1");
    expect(empty.confidence).toBe("low");

    const complete: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "outbound", U6: 50 };
    const full = computeDataQuality(complete, "D1");
    expect(full.confidence === "medium" || full.confidence === "high").toBe(true);
  });

  it("qualidade de dados incorpora a completude do funil quando informada", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2, D1_Q1: "outbound", U6: 50 };
    const withoutFunnel = computeDataQuality(answers, "D1", 0);
    const withFullFunnel = computeDataQuality(answers, "D1", 100);
    expect(withFullFunnel.dataQualityPercentage).toBeGreaterThan(withoutFunnel.dataQualityPercentage);
  });
});
