import { describe, expect, it } from "vitest";

import { SafeFetchException, safeFetch } from "@/lib/security/safe-fetch";

/**
 * Testes de integração de verdade (sem mocks) do safeFetch contra alvos
 * inseguros — exercitam o caminho completo (validação de forma da URL +
 * resolução de DNS real via node:dns + checagem de faixa de IP), não só
 * as funções puras de src/lib/security/url-guard.ts.
 *
 * Não dependem de acesso à internet: "localhost" e endereços IP literais
 * são resolvidos localmente pelo Node, sem sair para a rede.
 */
describe("safeFetch (integração, sem mocks)", () => {
  it("bloqueia localhost pelo nome, antes de qualquer resolução de DNS", async () => {
    await expect(safeFetch("http://localhost/")).rejects.toMatchObject({
      code: "blocked_hostname",
    });
  });

  it("bloqueia o IP de loopback literal (127.0.0.1)", async () => {
    await expect(safeFetch("http://127.0.0.1/")).rejects.toMatchObject({
      code: "blocked_ip_address",
    });
  });

  it("bloqueia o endpoint de metadados de nuvem (169.254.169.254)", async () => {
    await expect(
      safeFetch("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toMatchObject({
      code: "blocked_ip_address",
    });
  });

  it("bloqueia um IP privado literal (192.168.0.1)", async () => {
    await expect(safeFetch("http://192.168.0.1/")).rejects.toMatchObject({
      code: "blocked_ip_address",
    });
  });

  it("bloqueia URLs com credenciais embutidas antes de resolver DNS", async () => {
    await expect(safeFetch("http://usuario:senha@127.0.0.1/")).rejects.toMatchObject({
      code: "credentials_not_allowed",
    });
  });

  it("bloqueia porta incomum antes de resolver DNS", async () => {
    await expect(safeFetch("http://127.0.0.1:8080/")).rejects.toMatchObject({
      code: "port_not_allowed",
    });
  });

  it("todos os erros de bloqueio são instâncias de SafeFetchException", async () => {
    try {
      await safeFetch("http://localhost/");
      expect.unreachable("deveria ter lançado uma exceção");
    } catch (error) {
      expect(error).toBeInstanceOf(SafeFetchException);
    }
  });
});
