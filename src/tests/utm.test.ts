import { describe, expect, it } from "vitest";

import { appendUtmParams, hasUtmParams, pickUtmParams, serializeUtmParams } from "@/lib/utm";

describe("pickUtmParams", () => {
  it("pega só os utm_* e ignora outros parâmetros", () => {
    expect(pickUtmParams("utm_source=google&utm_medium=cpc&analysisError=1&gclid=abc")).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
    });
  });

  it("descarta valores vazios ou longos demais", () => {
    expect(pickUtmParams(`utm_source=%20&utm_campaign=${"a".repeat(201)}`)).toEqual({});
  });

  it("aceita entrada vazia", () => {
    expect(pickUtmParams(null)).toEqual({});
    expect(hasUtmParams(pickUtmParams(""))).toBe(false);
  });
});

describe("appendUtmParams", () => {
  const utm = { utm_source: "google", utm_medium: "cpc", utm_campaign: "plano" };

  it("acrescenta os UTMs a um caminho sem query", () => {
    expect(appendUtmParams("/diagnostico/abc", utm)).toBe(
      "/diagnostico/abc?utm_source=google&utm_medium=cpc&utm_campaign=plano",
    );
  });

  it("preserva a query que o caminho já tem", () => {
    expect(appendUtmParams("/diagnostico/abc?analysisError=1", { utm_source: "google" })).toBe(
      "/diagnostico/abc?analysisError=1&utm_source=google",
    );
  });

  it("não mistura campanhas: se o caminho já traz algum utm_*, não acrescenta nenhum", () => {
    expect(appendUtmParams("/diagnostico?utm_source=meta", utm)).toBe("/diagnostico?utm_source=meta");
  });

  it("não muda nada quando não há UTMs guardados", () => {
    expect(appendUtmParams("/diagnostico/abc", {})).toBe("/diagnostico/abc");
  });
});

describe("serializeUtmParams", () => {
  it("vai e volta sem perder valores com espaço e acento", () => {
    const utm = { utm_source: "google", utm_campaign: "plano comercial ação" };
    expect(pickUtmParams(serializeUtmParams(utm))).toEqual(utm);
  });
});
