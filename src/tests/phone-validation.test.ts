import { describe, expect, it } from "vitest";

import { formatBrazilianPhone, phoneSchema } from "@/lib/validation/phone";

describe("phoneSchema", () => {
  it.each(["(11) 98765-4321", "11987654321", "(11) 3265-4321", "1132654321"])(
    "aceita %s (celular ou fixo, com ou sem máscara)",
    (phone) => {
      expect(phoneSchema.safeParse(phone).success).toBe(true);
    },
  );

  it("rejeita telefone vazio (obrigatório nesta etapa)", () => {
    expect(phoneSchema.safeParse("").success).toBe(false);
  });

  it("rejeita telefone com poucos dígitos", () => {
    expect(phoneSchema.safeParse("1198765").success).toBe(false);
  });
});

describe("formatBrazilianPhone", () => {
  it("formata celular (11 dígitos)", () => {
    expect(formatBrazilianPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata fixo (10 dígitos)", () => {
    expect(formatBrazilianPhone("1132654321")).toBe("(11) 3265-4321");
  });

  it("aplica a máscara progressivamente e ignora dígitos extras", () => {
    expect(formatBrazilianPhone("11")).toBe("(11");
    expect(formatBrazilianPhone("119")).toBe("(11) 9");
    expect(formatBrazilianPhone("119876543210000")).toBe("(11) 98765-4321");
  });
});
