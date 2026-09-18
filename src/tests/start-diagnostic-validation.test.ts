import { describe, expect, it } from "vitest";

import { startDiagnosticSchema } from "@/lib/validation/start-diagnostic";

const baseInput = {
  name: "Maria Souza",
  companyName: "CodeBit Tecnologia",
  website: "",
  email: "maria@codebit.com.br",
  keywords: "consultoria financeira, planejamento tributário, abertura de empresa, contabilidade, assessoria fiscal",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
};

describe("startDiagnosticSchema", () => {
  it("aceita um envio válido sem site", () => {
    const result = startDiagnosticSchema.safeParse(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBeUndefined();
    }
  });

  it.each(["codebit.com.br", "www.codebit.com.br", "https://codebit.com.br"])(
    "aceita o site em formatos diferentes: %s",
    (website) => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, website });
      expect(result.success).toBe(true);
    },
  );

  it("rejeita um texto que não parece um site", () => {
    const result = startDiagnosticSchema.safeParse({
      ...baseInput,
      website: "não é um site",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome da pessoa muito curto", () => {
    const result = startDiagnosticSchema.safeParse({ ...baseInput, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome da pessoa ausente", () => {
    const result = startDiagnosticSchema.safeParse({ ...baseInput, name: undefined });
    expect(result.success).toBe(false);
  });

  describe("telefone (opcional, com ou sem máscara)", () => {
    it("aceita ausência de telefone", () => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, phone: "" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone).toBeUndefined();
    });

    it.each(["(11) 98765-4321", "11987654321", "(11) 3265-4321", "1132654321"])(
      "aceita %s (celular ou fixo, com ou sem máscara)",
      (phone) => {
        const result = startDiagnosticSchema.safeParse({ ...baseInput, phone });
        expect(result.success).toBe(true);
      },
    );

    it("rejeita um telefone com poucos dígitos", () => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, phone: "1198765" });
      expect(result.success).toBe(false);
    });
  });

  it("rejeita nome de empresa muito curto", () => {
    const result = startDiagnosticSchema.safeParse({ ...baseInput, companyName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome de empresa ausente", () => {
    const result = startDiagnosticSchema.safeParse({
      ...baseInput,
      companyName: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail em formato inválido", () => {
    const result = startDiagnosticSchema.safeParse({
      ...baseInput,
      email: "nao-e-um-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail ausente", () => {
    const result = startDiagnosticSchema.safeParse({ ...baseInput, email: "" });
    expect(result.success).toBe(false);
  });

  describe("e-mail corporativo (rejeita provedores pessoais/gratuitos)", () => {
    it.each([
      "maria@gmail.com",
      "maria@Gmail.com",
      "maria@yahoo.com",
      "maria@yahoo.com.br",
      "maria@hotmail.com",
      "maria@outlook.com",
      "maria@icloud.com",
      "maria@uol.com.br",
      "maria@bol.com.br",
    ])("rejeita %s", (email) => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, email });
      expect(result.success).toBe(false);
    });

    it("aceita um e-mail de domínio corporativo normal", () => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, email: "maria@codebit.com.br" });
      expect(result.success).toBe(true);
    });
  });

  it("captura os UTMs quando presentes e os omite quando ausentes", () => {
    const withUtm = startDiagnosticSchema.safeParse({
      ...baseInput,
      utmSource: "google",
      utmMedium: "cpc",
    });

    expect(withUtm.success).toBe(true);
    if (withUtm.success) {
      expect(withUtm.data.utmSource).toBe("google");
      expect(withUtm.data.utmMedium).toBe("cpc");
      expect(withUtm.data.utmCampaign).toBeUndefined();
    }
  });

  it("aparam espaços em branco do nome da empresa e do e-mail", () => {
    const result = startDiagnosticSchema.safeParse({
      ...baseInput,
      companyName: "  CodeBit  ",
      email: "  maria@codebit.com.br  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe("CodeBit");
      expect(result.data.email).toBe("maria@codebit.com.br");
    }
  });

  describe("keywords", () => {
    it("aceita palavras-chave separadas por vírgula, aparando espaços", () => {
      const result = startDiagnosticSchema.safeParse({
        ...baseInput,
        keywords: "  contabilidade , planejamento tributário ,abertura de empresa, consultoria, assessoria",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual([
          "contabilidade",
          "planejamento tributário",
          "abertura de empresa",
          "consultoria",
          "assessoria",
        ]);
      }
    });

    it("aceita palavras-chave separadas por linha", () => {
      const result = startDiagnosticSchema.safeParse({
        ...baseInput,
        keywords: "contabilidade\nplanejamento tributário\nabertura de empresa\nconsultoria\nassessoria",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toHaveLength(5);
      }
    });

    it("remove duplicatas (sem diferenciar maiúsculas/minúsculas)", () => {
      const result = startDiagnosticSchema.safeParse({
        ...baseInput,
        keywords: "Contabilidade, contabilidade, planejamento tributário, abertura de empresa, consultoria, assessoria",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toHaveLength(5);
      }
    });

    it("rejeita menos de 5 palavras-chave", () => {
      const result = startDiagnosticSchema.safeParse({
        ...baseInput,
        keywords: "contabilidade, consultoria, abertura de empresa",
      });
      expect(result.success).toBe(false);
    });

    it("rejeita mais de 10 palavras-chave", () => {
      const keywords = Array.from({ length: 11 }, (_, i) => `palavra${i}`).join(", ");
      const result = startDiagnosticSchema.safeParse({ ...baseInput, keywords });
      expect(result.success).toBe(false);
    });

    it("rejeita ausência de palavras-chave", () => {
      const result = startDiagnosticSchema.safeParse({ ...baseInput, keywords: "" });
      expect(result.success).toBe(false);
    });

    it("rejeita uma palavra-chave individual muito longa", () => {
      const longKeyword = "a".repeat(61);
      const result = startDiagnosticSchema.safeParse({
        ...baseInput,
        keywords: `${longKeyword}, contabilidade, consultoria, abertura de empresa, assessoria`,
      });
      expect(result.success).toBe(false);
    });
  });
});
