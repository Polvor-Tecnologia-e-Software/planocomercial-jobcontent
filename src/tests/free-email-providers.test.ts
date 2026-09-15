import { describe, expect, it } from "vitest";

import { isFreeEmailDomain } from "@/lib/validation/free-email-providers";

describe("isFreeEmailDomain", () => {
  it.each([
    "pessoa@gmail.com",
    "pessoa@GMAIL.COM",
    "pessoa@yahoo.com",
    "pessoa@yahoo.com.br",
    "pessoa@hotmail.com",
    "pessoa@hotmail.com.br",
    "pessoa@outlook.com",
    "pessoa@live.com",
    "pessoa@icloud.com",
    "pessoa@uol.com.br",
    "pessoa@bol.com.br",
    "pessoa@terra.com.br",
  ])("identifica %s como provedor pessoal/gratuito", (email) => {
    expect(isFreeEmailDomain(email)).toBe(true);
  });

  it.each(["pessoa@codebit.com.br", "pessoa@empresa.com", "contato@jobcontent.com.br"])(
    "não marca %s (domínio corporativo comum) como pessoal",
    (email) => {
      expect(isFreeEmailDomain(email)).toBe(false);
    },
  );

  it("retorna false para um texto sem @ (não é papel desta função validar formato)", () => {
    expect(isFreeEmailDomain("nao-e-um-email")).toBe(false);
  });

  it("não confunde um subdomínio com o domínio bloqueado (ex.: mail.gmail.com.br não é gmail.com)", () => {
    expect(isFreeEmailDomain("pessoa@mail.gmail.com.br")).toBe(false);
  });
});
