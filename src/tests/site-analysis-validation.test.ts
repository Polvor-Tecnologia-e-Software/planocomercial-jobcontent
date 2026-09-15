import { describe, expect, it } from "vitest";

import { AiResponseValidationError } from "@/lib/ai/errors";
import { validateSiteAnalysisResult } from "@/lib/ai/site-analysis-validation";

const validResult = {
  company_name: "Acme",
  description: null,
  segment: null,
  products_services: [],
  main_offer: null,
  apparent_target_audience: null,
  probable_business_model: null,
  value_proposition: null,
  differentiators: [],
  commercial_proofs: [],
  calls_to_action: [],
  contact_channels: [],
  conversion_assets: [],
  main_findings: [],
  evidence: [],
  confidence: "low" as const,
};

describe("validateSiteAnalysisResult", () => {
  it("retorna os dados validados quando o resultado é válido", () => {
    const result = validateSiteAnalysisResult(validResult);
    expect(result).toEqual(validResult);
  });

  it("lança AiResponseValidationError quando o resultado é inválido", () => {
    expect(() => validateSiteAnalysisResult({ foo: "bar" })).toThrow(
      AiResponseValidationError,
    );
  });

  it("lança AiResponseValidationError quando há um campo inesperado", () => {
    expect(() =>
      validateSiteAnalysisResult({ ...validResult, campo_extra: "não deveria existir" }),
    ).toThrow(AiResponseValidationError);
  });

  it("preserva o valor bruto no erro, para depuração", () => {
    try {
      validateSiteAnalysisResult("isso não é nem um objeto");
      expect.unreachable("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(AiResponseValidationError);
      expect((error as AiResponseValidationError).raw).toBe("isso não é nem um objeto");
    }
  });

  it("lança quando o valor é null ou undefined", () => {
    expect(() => validateSiteAnalysisResult(null)).toThrow(AiResponseValidationError);
    expect(() => validateSiteAnalysisResult(undefined)).toThrow(
      AiResponseValidationError,
    );
  });
});
