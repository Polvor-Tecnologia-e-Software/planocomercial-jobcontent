import { describe, expect, it } from "vitest";

import {
  linesToList,
  listToLines,
  parseCompanyProfileFieldsFromForm,
  toNullableString,
} from "@/lib/validation/site-analysis-confirmation";

describe("listToLines / linesToList", () => {
  it("junta e separa itens ida e volta sem perder nada", () => {
    const items = ["Atendimento 24/7", "Integração nativa com ERP"];
    expect(linesToList(listToLines(items))).toEqual(items);
  });

  it("remove linhas vazias e espaços nas pontas ao converter de volta", () => {
    expect(linesToList("  Item 1  \n\n  \nItem 2\n")).toEqual(["Item 1", "Item 2"]);
  });

  it("retorna lista vazia quando o valor não é string", () => {
    expect(linesToList(null)).toEqual([]);
  });
});

describe("toNullableString", () => {
  it("converte string vazia ou só espaços em null", () => {
    expect(toNullableString("")).toBeNull();
    expect(toNullableString("   ")).toBeNull();
  });

  it("mantém o valor de texto sem espaços nas pontas", () => {
    expect(toNullableString("  ACME Tecnologia  ")).toBe("ACME Tecnologia");
  });

  it("retorna null quando o valor não é string (campo ausente ou arquivo)", () => {
    expect(toNullableString(null)).toBeNull();
  });
});

describe("parseCompanyProfileFieldsFromForm", () => {
  it("extrai todos os campos do FormData da Tela 3", () => {
    const formData = new FormData();
    formData.set("description", "Plataforma de automação comercial B2B.");
    formData.set("segment", "Tecnologia");
    formData.set("mainOffer", "Automação de vendas");
    formData.set("targetAudience", "Empresas B2B de médio porte");
    formData.set("businessModel", "SaaS por assinatura");
    formData.set("differentiators", "Suporte 24/7\nIntegração com ERP");
    formData.set("commercialProofs", "+500 clientes ativos");
    formData.set("conversionMechanisms", "Formulário de contato\nBotão de WhatsApp");

    const fields = parseCompanyProfileFieldsFromForm(formData);

    expect(fields).toEqual({
      description: "Plataforma de automação comercial B2B.",
      segment: "Tecnologia",
      mainOffer: "Automação de vendas",
      targetAudience: "Empresas B2B de médio porte",
      businessModel: "SaaS por assinatura",
      differentiators: ["Suporte 24/7", "Integração com ERP"],
      commercialProofs: ["+500 clientes ativos"],
      conversionMechanisms: ["Formulário de contato", "Botão de WhatsApp"],
    });
  });

  it("trata campos ausentes como null (texto) ou lista vazia", () => {
    const fields = parseCompanyProfileFieldsFromForm(new FormData());

    expect(fields).toEqual({
      description: null,
      segment: null,
      mainOffer: null,
      targetAudience: null,
      businessModel: null,
      differentiators: [],
      commercialProofs: [],
      conversionMechanisms: [],
    });
  });
});
