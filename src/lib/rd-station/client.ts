import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { RD_STATION_CONVERSIONS_ENDPOINT } from "@/lib/rd-station/config";
import type { RdStationConversionPayload } from "@/lib/rd-station/payload";

const TIMEOUT_MS = 10_000;

/**
 * Resultado classificado da chamada HTTP — nunca lança. Quem chama decide
 * o que fazer com cada categoria (ver src/server/send-rd-station-conversion.ts):
 * sucesso, erro permanente (validação/autenticação, não adianta repetir) ou
 * erro temporário (rede/timeout/5xx/429, pode tentar de novo mais tarde).
 */
export type RdStationCallOutcome =
  | { kind: "success"; httpStatus: number; latencyMs: number; eventUuid: string | null }
  | { kind: "validation_error"; httpStatus: number; latencyMs: number }
  | { kind: "auth_error"; httpStatus: number; latencyMs: number }
  | { kind: "rate_limited"; httpStatus: number; latencyMs: number }
  | { kind: "server_error"; httpStatus: number; latencyMs: number }
  | { kind: "timeout"; latencyMs: number }
  | { kind: "network_error"; latencyMs: number };

function readEventUuid(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>).event_uuid;
  return typeof value === "string" ? value : null;
}

/**
 * Envia uma Conversão ao RD Station Marketing via API Key (query string —
 * nunca OAuth/Bearer para esta integração). Timeout curto (a chamada
 * acontece de forma síncrona, best-effort, depois do plano já estar
 * pronto — nunca deve seguransar a resposta ao usuário por muito tempo).
 *
 * Nunca loga a API Key nem o payload completo (pode conter e-mail/telefone)
 * — quem chama decide o que logar a partir do resultado classificado aqui
 * (status HTTP, categoria, latência), nunca o corpo bruto da requisição.
 */
export async function sendConversion(payload: RdStationConversionPayload): Promise<RdStationCallOutcome> {
  const env = parseServerEnv();
  const apiKey = env.RD_STATION_API_KEY;

  if (!apiKey) {
    // Defensivo: quem chama já deveria ter checado isso antes (ver
    // sendRdStationConversion) — nunca deveríamos chegar aqui sem API Key.
    return { kind: "auth_error", httpStatus: 0, latencyMs: 0 };
  }

  const url = `${RD_STATION_CONVERSIONS_ENDPOINT}?api_key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "CONVERSION",
        event_family: "CDP",
        payload,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;

    if (response.status === 200 || response.status === 201) {
      const body = await response.json().catch(() => null);
      return { kind: "success", httpStatus: response.status, latencyMs, eventUuid: readEventUuid(body) };
    }

    if (response.status === 401 || response.status === 403) {
      return { kind: "auth_error", httpStatus: response.status, latencyMs };
    }

    if (response.status === 429) {
      return { kind: "rate_limited", httpStatus: response.status, latencyMs };
    }

    if (response.status >= 500) {
      return { kind: "server_error", httpStatus: response.status, latencyMs };
    }

    // 400 e demais 4xx: erro de validação do payload — repetir sem mudar
    // nada não vai corrigir, então é tratado como permanente.
    return { kind: "validation_error", httpStatus: response.status, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    if (err instanceof Error && err.name === "AbortError") {
      return { kind: "timeout", latencyMs };
    }
    return { kind: "network_error", latencyMs };
  } finally {
    clearTimeout(timeoutId);
  }
}
