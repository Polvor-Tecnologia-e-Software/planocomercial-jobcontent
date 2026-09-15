import { describe, expect, it } from "vitest";

import { checkIpAddress, checkUrlShape } from "@/lib/security/url-guard";

describe("checkUrlShape", () => {
  it("aceita URLs http e https normais", () => {
    expect(checkUrlShape("https://acme.com.br")).toEqual(
      expect.objectContaining({ safe: true }),
    );
    expect(checkUrlShape("http://acme.com.br")).toEqual(
      expect.objectContaining({ safe: true }),
    );
  });

  it("rejeita texto que não é uma URL", () => {
    expect(checkUrlShape("não é uma url")).toEqual({
      safe: false,
      reason: "invalid_url",
    });
  });

  it("rejeita protocolos diferentes de http/https", () => {
    expect(checkUrlShape("file:///etc/passwd")).toEqual({
      safe: false,
      reason: "unsupported_protocol",
    });
    expect(checkUrlShape("ftp://acme.com")).toEqual({
      safe: false,
      reason: "unsupported_protocol",
    });
    expect(checkUrlShape("gopher://acme.com")).toEqual({
      safe: false,
      reason: "unsupported_protocol",
    });
  });

  it("rejeita URLs com credenciais embutidas", () => {
    expect(checkUrlShape("https://usuario:senha@acme.com")).toEqual({
      safe: false,
      reason: "credentials_not_allowed",
    });
  });

  it("rejeita portas incomuns", () => {
    expect(checkUrlShape("https://acme.com:8080")).toEqual({
      safe: false,
      reason: "port_not_allowed",
    });
    expect(checkUrlShape("http://acme.com:22")).toEqual({
      safe: false,
      reason: "port_not_allowed",
    });
  });

  it("aceita as portas padrão explícitas 80 e 443", () => {
    expect(checkUrlShape("http://acme.com:80")).toEqual(
      expect.objectContaining({ safe: true }),
    );
    expect(checkUrlShape("https://acme.com:443")).toEqual(
      expect.objectContaining({ safe: true }),
    );
  });

  it("bloqueia localhost pelo nome", () => {
    expect(checkUrlShape("http://localhost")).toEqual({
      safe: false,
      reason: "blocked_hostname",
    });
    expect(checkUrlShape("http://localhost:80")).toEqual({
      safe: false,
      reason: "blocked_hostname",
    });
  });

  it("bloqueia hostnames de endpoints de metadados de nuvem", () => {
    expect(checkUrlShape("http://metadata.google.internal")).toEqual({
      safe: false,
      reason: "blocked_hostname",
    });
  });
});

describe("checkIpAddress", () => {
  it("aceita IPs públicos", () => {
    expect(checkIpAddress("8.8.8.8")).toEqual({ safe: true });
    expect(checkIpAddress("1.1.1.1")).toEqual({ safe: true });
  });

  it("bloqueia loopback (IPv4 e IPv6)", () => {
    expect(checkIpAddress("127.0.0.1").safe).toBe(false);
    expect(checkIpAddress("::1").safe).toBe(false);
  });

  it("bloqueia faixas privadas (RFC 1918)", () => {
    expect(checkIpAddress("10.0.0.1").safe).toBe(false);
    expect(checkIpAddress("172.16.0.5").safe).toBe(false);
    expect(checkIpAddress("192.168.1.1").safe).toBe(false);
  });

  it("bloqueia o endpoint de metadados de nuvem (169.254.169.254)", () => {
    expect(checkIpAddress("169.254.169.254").safe).toBe(false);
  });

  it("bloqueia link-local IPv6", () => {
    expect(checkIpAddress("fe80::1").safe).toBe(false);
  });

  it("bloqueia unique-local IPv6 (equivalente a privado)", () => {
    expect(checkIpAddress("fc00::1").safe).toBe(false);
  });

  it("bloqueia endereços IPv4-mapeados em IPv6 que seriam bloqueados como IPv4", () => {
    expect(checkIpAddress("::ffff:169.254.169.254").safe).toBe(false);
    expect(checkIpAddress("::ffff:127.0.0.1").safe).toBe(false);
  });

  it("bloqueia carrier-grade NAT (100.64.0.0/10)", () => {
    expect(checkIpAddress("100.64.0.1").safe).toBe(false);
  });

  it("bloqueia multicast e o endereço não especificado", () => {
    expect(checkIpAddress("224.0.0.1").safe).toBe(false);
    expect(checkIpAddress("0.0.0.0").safe).toBe(false);
  });

  it("rejeita texto que não é um IP válido", () => {
    expect(checkIpAddress("não-é-um-ip").safe).toBe(false);
  });
});
