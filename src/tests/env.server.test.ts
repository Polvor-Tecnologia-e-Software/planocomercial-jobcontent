import { describe, expect, it } from "vitest";

import { serverEnvSchema } from "@/config/env.server";

const validServerEnv = {
  SUPABASE_SERVICE_ROLE_KEY: "service-role-de-teste",
  AI_API_KEY: "chave-de-ia-de-teste",
  AI_MODEL: "modelo-de-teste",
  RD_STATION_CLIENT_ID: "client-id-de-teste",
  RD_STATION_CLIENT_SECRET: "client-secret-de-teste",
  RD_STATION_REFRESH_TOKEN: "refresh-token-de-teste",
  APP_URL: "https://plano90dias.exemplo.com.br",
};

describe("serverEnvSchema", () => {
  it("aceita uma configuração de servidor válida", () => {
    const result = serverEnvSchema.safeParse(validServerEnv);
    expect(result.success).toBe(true);
  });

  it("rejeita quando falta uma variável obrigatória", () => {
    const incomplete: Partial<typeof validServerEnv> = { ...validServerEnv };
    delete incomplete.AI_API_KEY;

    const result = serverEnvSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejeita quando APP_URL não é uma URL válida", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv,
      APP_URL: "nao-e-uma-url",
    });

    expect(result.success).toBe(false);
  });

  it("aceita uma variável opcional deixada em branco no .env.local (string vazia), sem quebrar as demais", () => {
    // Regressão: um .env.local real grava "CHAVE=" (sem valor) como
    // string vazia, não como ausente — sem tratar isso como "opcional",
    // uma única variável opcional em branco (ex.: RD_STATION_CLIENT_ID,
    // que só é necessária em alguns casos) quebrava a validação inteira,
    // inclusive para fluxos sem nenhuma relação com o campo vazio.
    const result = serverEnvSchema.safeParse({
      ...validServerEnv,
      RD_STATION_API_KEY: "",
      RD_STATION_CLIENT_ID: "",
      RD_STATION_CLIENT_SECRET: "",
      RD_STATION_REFRESH_TOKEN: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.RD_STATION_CLIENT_ID).toBeUndefined();
    }
  });
});
