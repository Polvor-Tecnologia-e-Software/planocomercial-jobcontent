import { describe, expect, it } from "vitest";

import { clientEnvSchema } from "@/config/env.client";

describe("clientEnvSchema", () => {
  it("aceita uma configuração pública válida", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-anonima-de-teste",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita quando a URL do Supabase está ausente", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-anonima-de-teste",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita quando a URL do Supabase não é uma URL válida", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "isso-nao-e-uma-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-anonima-de-teste",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita quando a chave anônima está vazia", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });

    expect(result.success).toBe(false);
  });
});
