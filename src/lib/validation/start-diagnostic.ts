import { z } from "zod";

import { isFreeEmailDomain } from "@/lib/validation/free-email-providers";

/**
 * Converte um valor de FormData (string | null) em string, tratando
 * ausência de campo como string vazia. Usado como preprocess para que
 * campos ausentes caiam nas mensagens de erro customizadas (ex.: "min"),
 * em vez do erro genérico de tipo do Zod.
 */
function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Converte uma string vazia (ou só espaços) em undefined, para campos
 * opcionais como o site e os UTMs.
 */
function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Valida um site informado pelo usuário de forma tolerante: aceita com
 * ou sem "https://", com ou sem "www.", e rejeita textos que claramente
 * não são um domínio (seção 5.3 do BRD: "Normalizar URL; aceitar apenas
 * HTTP/HTTPS"). A normalização "de verdade" (para dedupe e cache) é
 * feita pela função normalize_website (banco) e seu espelho em
 * src/lib/database/normalize-website.ts — este validador aqui só
 * confirma que o texto tem forma de site.
 */
function isValidWebsite(value: string): boolean {
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    // Exige um domínio com pelo menos um ponto (ex.: "acme.com"), para
    // rejeitar entradas como "acme" ou "https://localhost".
    return url.hostname.includes(".") && url.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Divide o texto do campo de palavras-chave em uma lista: aceita
 * separação por vírgula ou por linha, ignora entradas vazias e remove
 * duplicatas (sem diferenciar maiúsculas/minúsculas).
 */
function splitKeywords(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of value.split(/[,\n]/)) {
    const keyword = raw.trim();
    if (keyword === "") continue;

    const dedupeKey = keyword.toLowerCase();
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    result.push(keyword);
  }

  return result;
}

export const startDiagnosticSchema = z.object({
  name: z.preprocess(
    toStringOrEmpty,
    z
      .string()
      .trim()
      .min(2, "Informe seu nome.")
      .max(150, "Esse nome está muito longo."),
  ),

  companyName: z.preprocess(
    toStringOrEmpty,
    z
      .string()
      .trim()
      .min(2, "Informe o nome da sua empresa.")
      .max(200, "Esse nome está muito longo."),
  ),

  // Opcional (seção 4 do BRD: "aceitar ausência de site").
  website: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z
      .string()
      .max(300, "Esse endereço está muito longo.")
      .refine(
        isValidWebsite,
        "Informe um site válido (ex.: suaempresa.com.br) ou deixe em branco.",
      )
      .optional(),
  ),

  email: z.preprocess(
    toStringOrEmpty,
    z
      .string()
      .trim()
      .min(1, "Informe seu e-mail corporativo.")
      .email("Informe um e-mail válido (ex.: voce@suaempresa.com.br).")
      .refine(
        (value) => !isFreeEmailDomain(value),
        "Informe um e-mail corporativo — não aceitamos e-mails pessoais (Gmail, Yahoo, Hotmail, etc.).",
      ),
  ),

  // Palavras-chave que resumem o negócio (5 a 10) — usadas pela IA como
  // ponto de partida para sugerir oportunidades de SEO no plano final
  // (ver src/lib/ai/seo-keywords-prompt.ts).
  keywords: z.preprocess(
    (value) => splitKeywords(toStringOrEmpty(value)),
    z
      .array(z.string().max(60, "Cada palavra-chave pode ter no máximo 60 caracteres."))
      .min(5, "Informe pelo menos 5 palavras-chave.")
      .max(10, "Informe no máximo 10 palavras-chave."),
  ),

  // UTMs (seção 4 do BRD: "Persistir automaticamente desde a primeira
  // visita"). Todos opcionais e sem validação de formato — são apenas
  // rastreados, não usados em nenhuma regra de negócio.
  utmSource: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z.string().max(200).optional(),
  ),
  utmMedium: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z.string().max(200).optional(),
  ),
  utmCampaign: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z.string().max(200).optional(),
  ),
  utmContent: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z.string().max(200).optional(),
  ),
  utmTerm: z.preprocess(
    (value) => emptyToUndefined(toStringOrEmpty(value)),
    z.string().max(200).optional(),
  ),
});

export type StartDiagnosticFormValues = z.infer<typeof startDiagnosticSchema>;
