import "server-only";

import ipaddr from "ipaddr.js";

/**
 * Validação de URL e de endereços IP contra ataques SSRF (seção 5.3 e
 * 19 do BRD). Este arquivo contém só lógica pura (sem DNS, sem rede) —
 * o objetivo é poder testar cada regra isoladamente e com rapidez. A
 * resolução de DNS de verdade e a conexão HTTP ficam em safe-fetch.ts.
 */

export const ALLOWED_PORTS = new Set([80, 443]);

/**
 * Hostnames conhecidos por apontar para endpoints de metadados de nuvem
 * ou para a própria máquina. Bloqueados pelo nome, além da checagem por
 * IP (defesa em profundidade — o nome pode não resolver como esperado
 * em todo ambiente, então checamos os dois).
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

export type UrlShapeError =
  | "invalid_url"
  | "unsupported_protocol"
  | "credentials_not_allowed"
  | "port_not_allowed"
  | "blocked_hostname";

export type UrlShapeResult =
  { safe: true; url: URL; port: number } | { safe: false; reason: UrlShapeError };

/**
 * Primeira camada de validação: só olha para o texto da URL, sem
 * resolver DNS. Confirma protocolo, ausência de credenciais embutidas,
 * porta permitida e hostname não bloqueado por nome.
 */
export function checkUrlShape(rawUrl: string): UrlShapeResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "invalid_url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { safe: false, reason: "unsupported_protocol" };
  }

  // Bloqueia URLs no formato http://usuario:senha@host (seção 19 do BRD).
  if (url.username !== "" || url.password !== "") {
    return { safe: false, reason: "credentials_not_allowed" };
  }

  const port =
    url.port === "" ? (url.protocol === "https:" ? 443 : 80) : Number(url.port);
  if (!ALLOWED_PORTS.has(port)) {
    return { safe: false, reason: "port_not_allowed" };
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: "blocked_hostname" };
  }

  return { safe: true, url, port };
}

/**
 * Faixas de IP consideradas inseguras para o crawler acessar: loopback,
 * privadas (RFC 1918), link-local (inclui o endpoint de metadados de
 * nuvem 169.254.169.254), CGNAT, reservadas, multicast e o intervalo
 * "unspecified". ipaddr.js já classifica a maioria dessas faixas tanto
 * para IPv4 quanto IPv6 através de `.range()`.
 */
const BLOCKED_RANGES = new Set([
  "unspecified",
  "loopback",
  "private", // RFC 1918 (IPv4) e faixas privadas equivalentes
  "linkLocal", // inclui 169.254.169.254 (metadata endpoint) e fe80::/10
  "uniqueLocal", // fc00::/7 (equivalente IPv6 de "private")
  "multicast",
  "reserved",
  "broadcast",
  "carrierGradeNat", // 100.64.0.0/10
]);

export type IpCheckResult = { safe: true } | { safe: false; reason: string };

/**
 * Verifica se um endereço IP (já resolvido via DNS) é seguro para o
 * crawler acessar. Trata endereços IPv4-mapeados-em-IPv6
 * (::ffff:169.254.169.254) reduzindo-os ao IPv4 equivalente antes de
 * classificar, para que não escapem do bloqueio.
 */
export function checkIpAddress(ip: string): IpCheckResult {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(ip); // normaliza e já reduz IPv4-mapped para IPv4
  } catch {
    return { safe: false, reason: "invalid_ip" };
  }

  const range = addr.range();
  if (BLOCKED_RANGES.has(range)) {
    return { safe: false, reason: `blocked_ip_range:${range}` };
  }

  return { safe: true };
}
