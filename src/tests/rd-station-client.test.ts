import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env.server", () => ({
  parseServerEnv: () => ({
    AI_API_KEY: "x",
    AI_MODEL: "x",
    SUPABASE_SERVICE_ROLE_KEY: "x",
    APP_URL: "https://exemplo.com",
    RD_STATION_API_KEY: "chave-de-teste",
  }),
}));

const { sendConversion } = await import("@/lib/rd-station/client");
const { RD_STATION_CONVERSIONS_ENDPOINT } = await import("@/lib/rd-station/config");

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const PAYLOAD = { conversion_identifier: "plano-comercial-90-dias", email: "pessoa@empresa.com.br" };

describe("sendConversion — sucesso", () => {
  it("classifica 200 como sucesso e envia api_key na query string, nunca no header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { event_uuid: "abc-123" }));

    const outcome = await sendConversion(PAYLOAD);

    expect(outcome.kind).toBe("success");
    if (outcome.kind === "success") expect(outcome.eventUuid).toBe("abc-123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("api_key=chave-de-teste");
    expect(String(url)).toContain(RD_STATION_CONVERSIONS_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBeUndefined();

    const sentBody = JSON.parse(init.body);
    expect(sentBody).toEqual({ event_type: "CONVERSION", event_family: "CDP", payload: PAYLOAD });
  });
});

describe("sendConversion — erros classificados", () => {
  it("classifica 400 como validation_error (permanente)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error_type: "INVALID_OPTION" }));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("validation_error");
  });

  it("classifica 401 como auth_error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {}));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("auth_error");
  });

  it("classifica 403 como auth_error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, {}));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("auth_error");
  });

  it("classifica 429 como rate_limited (temporário)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, {}));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("rate_limited");
  });

  it("classifica 500 como server_error (temporário)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("server_error");
  });

  it("classifica timeout (AbortError) como timeout, não como network_error", async () => {
    fetchMock.mockImplementation(() => {
      const err = new Error("aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("timeout");
  });

  it("classifica uma falha de rede genérica como network_error", async () => {
    fetchMock.mockRejectedValue(new Error("fetch failed"));
    const outcome = await sendConversion(PAYLOAD);
    expect(outcome.kind).toBe("network_error");
  });
});

describe("sendConversion — todo resultado inclui latência", () => {
  it("mede latência em milissegundos, mesmo em caso de erro", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    const outcome = await sendConversion(PAYLOAD);
    expect(typeof outcome.latencyMs).toBe("number");
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
