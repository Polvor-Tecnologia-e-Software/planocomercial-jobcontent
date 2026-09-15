import { describe, expect, it } from "vitest";

import { normalizeWebsite } from "@/lib/database/normalize-website";

describe("normalizeWebsite", () => {
  it("remove protocolo, www e barra final", () => {
    expect(normalizeWebsite("https://www.CodeBit.com.br/")).toBe("codebit.com.br");
  });

  it("remove caminho e querystring", () => {
    expect(normalizeWebsite("http://acme.io/produtos?utm_source=google")).toBe("acme.io");
  });

  it("aceita um domínio já limpo", () => {
    expect(normalizeWebsite("acme.io")).toBe("acme.io");
  });

  it("retorna null para valores vazios ou ausentes", () => {
    expect(normalizeWebsite("")).toBeNull();
    expect(normalizeWebsite("   ")).toBeNull();
    expect(normalizeWebsite(null)).toBeNull();
    expect(normalizeWebsite(undefined)).toBeNull();
  });

  it("gera o mesmo resultado para variações da mesma URL (deduplicação)", () => {
    const variants = [
      "https://www.codebit.com.br",
      "http://codebit.com.br/",
      "www.codebit.com.br",
      "codebit.com.br/sobre",
    ];

    const normalized = variants.map(normalizeWebsite);
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("codebit.com.br");
  });
});
