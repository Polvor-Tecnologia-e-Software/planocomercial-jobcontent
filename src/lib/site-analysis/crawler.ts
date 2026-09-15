import "server-only";

import { SafeFetchException, safeFetch } from "@/lib/security/safe-fetch";
import { SITE_ANALYSIS_LIMITS } from "@/lib/site-analysis/constants";
import {
  discoverCandidateLinks,
  extractPageText,
  removeRepeatedBoilerplate,
} from "@/lib/site-analysis/html-extractor";
import { hashContent } from "@/lib/site-analysis/hash";

export type CrawledPage = {
  url: string;
  title: string;
  text: string;
};

export type CrawlResult = {
  normalizedUrl: string;
  pages: CrawledPage[];
  /** Texto combinado de todas as páginas, já truncado ao limite total. */
  combinedText: string;
  contentHash: string;
  warnings: string[];
};

export class CrawlFailedException extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CrawlFailedException";
    this.code = code;
  }
}

/**
 * Coleta a homepage e, quando disponíveis, as páginas de serviços,
 * sobre, cases e contato (seção 5 do BRD), tratando cada requisição como
 * insegura por padrão (safeFetch cuida de SSRF/DNS rebinding/timeout).
 *
 * Falha da homepage é fatal (não há o que analisar sem ela). Falha em
 * qualquer página adicional apenas gera um aviso e é ignorada — a seção
 * 5.3 do BRD exige que "falha ou resultado parcial nunca bloqueia a
 * conclusão do diagnóstico".
 */
export async function crawlSite(startUrl: string): Promise<CrawlResult> {
  const deadline = Date.now() + SITE_ANALYSIS_LIMITS.MAX_CRAWL_DURATION_MS;
  const warnings: string[] = [];

  let homepage;
  try {
    homepage = await safeFetch(startUrl);
  } catch (error) {
    const message =
      error instanceof SafeFetchException ? error.message : "Falha desconhecida.";
    throw new CrawlFailedException(
      error instanceof SafeFetchException ? error.code : "unknown_error",
      `Não foi possível acessar o site: ${message}`,
    );
  }

  const homeExtracted = extractPageText(homepage.body);
  const pages: CrawledPage[] = [
    { url: homepage.finalUrl, title: homeExtracted.title, text: homeExtracted.text },
  ];

  const candidateLinks = discoverCandidateLinks(homepage.body, homepage.finalUrl);

  for (const link of candidateLinks) {
    if (Date.now() > deadline) {
      warnings.push(
        "Tempo máximo de coleta atingido; algumas páginas não foram analisadas.",
      );
      break;
    }

    try {
      const page = await safeFetch(link);
      const extracted = extractPageText(page.body);
      if (extracted.text.length > 0) {
        pages.push({ url: page.finalUrl, title: extracted.title, text: extracted.text });
      }
    } catch (error) {
      const message =
        error instanceof SafeFetchException ? error.message : "falha desconhecida";
      warnings.push(`Não foi possível coletar ${link}: ${message}`);
    }
  }

  const cleanedPages = removeRepeatedBoilerplate(pages);

  const combinedText = cleanedPages
    .map((page) => `### Página: ${page.url}\n${page.text}`)
    .join("\n\n")
    .slice(0, SITE_ANALYSIS_LIMITS.MAX_TOTAL_CHARS);

  if (combinedText.trim().length === 0) {
    // A homepage respondeu, mas não sobrou texto útil (ex.: página quase
    // toda em imagens/JS). Não é um erro de rede, mas também não há o
    // que enviar para a IA — sinalizamos como aviso para o chamador
    // decidir (normalmente: seguir sem análise).
    warnings.push("Não foi possível extrair texto útil do site.");
  }

  return {
    normalizedUrl: homepage.finalUrl,
    pages: cleanedPages,
    combinedText,
    contentHash: hashContent(combinedText),
    warnings,
  };
}
