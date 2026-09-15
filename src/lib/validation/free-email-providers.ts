/**
 * Domínios de e-mail pessoal/gratuito — o diagnóstico exige um e-mail
 * corporativo (seção 4 do BRD), então esses domínios são rejeitados na
 * validação (ver start-diagnostic.ts). Lista de provedores globais mais
 * comuns + os mais usados no Brasil; não tenta ser exaustiva (novos
 * provedores só entram aqui se aparecerem no uso real).
 */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.com.br",
  "ymail.com",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "live.com",
  "live.com.br",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "ig.com.br",
  "r7.com",
  "globo.com",
  "globomail.com",
  "oi.com.br",
  "click21.com.br",
  "zipmail.com.br",
  "superig.com.br",
]);

/**
 * true quando o e-mail vem de um provedor pessoal/gratuito conhecido.
 * Compara só o domínio (parte depois do último "@"), sem diferenciar
 * maiúsculas/minúsculas. Um e-mail sem "@" (já barrado por .email() no
 * schema antes deste check) retorna false, nunca lança.
 */
export function isFreeEmailDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;

  const domain = email.slice(at + 1).trim().toLowerCase();
  return FREE_EMAIL_DOMAINS.has(domain);
}
