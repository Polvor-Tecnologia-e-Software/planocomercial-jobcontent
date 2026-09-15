import "server-only";

import { lookup as dnsLookup } from "node:dns/promises";
import * as http from "node:http";
import * as https from "node:https";

import { checkIpAddress, checkUrlShape } from "@/lib/security/url-guard";

const CONNECT_TIMEOUT_MS = 5_000;
const RESPONSE_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_REDIRECTS = 3;
const USER_AGENT = "PlanoComercialInteligenteBot/1.0 (+analise-automatica-de-site)";

export type SafeFetchError =
  | "invalid_url"
  | "unsupported_protocol"
  | "credentials_not_allowed"
  | "port_not_allowed"
  | "blocked_hostname"
  | "dns_resolution_failed"
  | "blocked_ip_address"
  | "too_many_redirects"
  | "redirect_missing_location"
  | "response_too_large"
  | "timeout"
  | "non_html_response"
  | "http_error"
  | "network_error";

export class SafeFetchException extends Error {
  readonly code: SafeFetchError;

  constructor(code: SafeFetchError, message: string) {
    super(message);
    this.name = "SafeFetchException";
    this.code = code;
  }
}

export type SafeFetchResult = {
  finalUrl: string;
  status: number;
  contentType: string | null;
  body: string;
};

/**
 * Resolve o hostname e garante que NENHUM dos IPs retornados está em uma
 * faixa bloqueada. Se um domínio responde com múltiplos IPs e apenas um
 * deles for privado, ainda assim rejeitamos o domínio inteiro — é um
 * sinal comum de tentativa de contornar o bloqueio.
 */
async function resolveAndValidateHostname(hostname: string): Promise<string> {
  let addresses: { address: string }[];

  try {
    addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SafeFetchException(
      "dns_resolution_failed",
      `Não foi possível resolver o domínio "${hostname}".`,
    );
  }

  if (addresses.length === 0) {
    throw new SafeFetchException(
      "dns_resolution_failed",
      `Domínio "${hostname}" não retornou nenhum endereço.`,
    );
  }

  for (const { address } of addresses) {
    const check = checkIpAddress(address);
    if (!check.safe) {
      throw new SafeFetchException(
        "blocked_ip_address",
        `O domínio "${hostname}" resolve para um endereço bloqueado (${check.reason}).`,
      );
    }
  }

  // Usa o primeiro endereço validado para a conexão real (pinning). Como
  // fixamos esse IP na própria requisição (ver requestPinned abaixo), um
  // ataque de DNS rebinding — em que o DNS muda de resposta entre a
  // validação e a conexão — não tem efeito: conectamos sempre no IP que
  // validamos agora, não em uma nova resolução feita no momento do connect.
  return addresses[0].address;
}

/**
 * Faz uma única requisição HTTP(S), conectando diretamente no IP já
 * validado (em vez de deixar o Node resolver o DNS de novo no momento do
 * connect — é isso que fecha a janela de SSRF/DNS rebinding). O cabeçalho
 * Host e o SNI/verificação de certificado continuam usando o hostname
 * original, então o servidor de destino recebe uma requisição idêntica à
 * de um cliente normal.
 */
function requestPinned(params: {
  url: URL;
  pinnedIp: string;
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const { url, pinnedIp } = params;
  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        // Conecta no IP fixado, não no hostname (evita nova resolução DNS).
        host: pinnedIp,
        hostname: pinnedIp,
        port: url.port ? Number(url.port) : isHttps ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        // Garante que o servidor receba o host original (name-based
        // virtual hosting) e que o certificado TLS seja validado contra
        // o domínio original, não o IP.
        headers: {
          Host: url.hostname,
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        ...(isHttps ? { servername: url.hostname, rejectUnauthorized: true } : {}),
        timeout: CONNECT_TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        let settled = false;

        const responseTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          res.destroy();
          reject(new SafeFetchException("timeout", "A resposta do site demorou demais."));
        }, RESPONSE_TIMEOUT_MS);

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            if (!settled) {
              settled = true;
              clearTimeout(responseTimer);
              res.destroy();
              reject(
                new SafeFetchException(
                  "response_too_large",
                  "A resposta do site excedeu o limite de tamanho.",
                ),
              );
            }
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          if (settled) return;
          settled = true;
          clearTimeout(responseTimer);
          resolve({ status, headers: res.headers, body: Buffer.concat(chunks) });
        });

        res.on("error", (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(responseTimer);
          reject(new SafeFetchException("network_error", error.message));
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(
        new SafeFetchException("timeout", "Tempo esgotado ao conectar com o site."),
      );
    });

    req.on("error", (error) => {
      if (error instanceof SafeFetchException) {
        reject(error);
        return;
      }
      reject(new SafeFetchException("network_error", error.message));
    });

    req.end();
  });
}

/**
 * Busca uma URL com todas as proteções exigidas pela seção 19 do BRD:
 * protocolo restrito, sem credenciais na URL, porta permitida, DNS
 * validado e "pinado" contra rebinding, redirecionamentos revalidados um
 * a um (com limite), timeout e limite de tamanho de resposta. Nunca
 * executa JavaScript (é uma requisição HTTP simples, sem navegador) e
 * nunca segue autenticação/login.
 */
export async function safeFetch(rawUrl: string): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const shapeCheck = checkUrlShape(currentUrl);
    if (!shapeCheck.safe) {
      throw new SafeFetchException(
        shapeCheck.reason,
        `URL não permitida (${shapeCheck.reason}).`,
      );
    }

    const pinnedIp = await resolveAndValidateHostname(shapeCheck.url.hostname);
    const response = await requestPinned({ url: shapeCheck.url, pinnedIp });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) {
        throw new SafeFetchException(
          "redirect_missing_location",
          "Redirecionamento sem destino informado.",
        );
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new SafeFetchException(
          "too_many_redirects",
          "Excesso de redirecionamentos.",
        );
      }

      // Resolve o destino do redirecionamento contra a URL atual (pode
      // ser relativo) e revalida tudo no próximo loop — nenhum destino de
      // redirecionamento é confiado sem passar pelas mesmas checagens.
      currentUrl = new URL(location, shapeCheck.url).toString();
      continue;
    }

    if (response.status >= 400) {
      throw new SafeFetchException(
        "http_error",
        `O site respondeu com status ${response.status}.`,
      );
    }

    const contentType = (response.headers["content-type"] as string | undefined) ?? null;
    if (contentType && !contentType.includes("html") && !contentType.includes("text/")) {
      throw new SafeFetchException(
        "non_html_response",
        `Tipo de conteúdo não suportado: ${contentType}.`,
      );
    }

    return {
      finalUrl: shapeCheck.url.toString(),
      status: response.status,
      contentType,
      body: response.body.toString("utf-8"),
    };
  }

  throw new SafeFetchException("too_many_redirects", "Excesso de redirecionamentos.");
}
