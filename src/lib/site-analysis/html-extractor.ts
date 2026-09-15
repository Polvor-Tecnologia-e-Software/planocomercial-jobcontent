import * as cheerio from "cheerio";

import {
  PAGE_DISCOVERY_KEYWORDS,
  SITE_ANALYSIS_LIMITS,
} from "@/lib/site-analysis/constants";

export type ExtractedPage = {
  title: string;
  text: string;
};

/**
 * Extrai apenas o texto visível e útil de uma página HTML: remove
 * scripts, estilos, comentários e elementos estruturais que normalmente
 * só repetem menu/rodapé em todas as páginas (nav, header, footer,
 * formulários, botões) — seção 5.3 do BRD: "extrair somente texto útil"
 * e "remover... menus repetidos".
 */
export function extractPageText(html: string): ExtractedPage {
  const $ = cheerio.load(html);

  $(
    "script, style, noscript, template, svg, nav, header, footer, form, button, iframe, [aria-hidden='true']",
  ).remove();
  $("*")
    .contents()
    .filter((_, node) => node.type === "comment")
    .remove();

  const title = $("title").first().text().trim().slice(0, 200);

  // Extrai o texto bloco a bloco (não caractere a caractere) para manter
  // quebras de linha entre parágrafos/seções, o que ajuda a IA a separar
  // ideias diferentes.
  const blocks: string[] = [];
  $("h1, h2, h3, h4, h5, h6, p, li, td, blockquote").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length >= 2) {
      blocks.push(text);
    }
  });

  // Fallback: se a página não usa nenhuma dessas tags (raro, mas
  // acontece em HTML malformado), cai para o texto puro do body.
  const text =
    blocks.length > 0
      ? blocks.join("\n")
      : $("body")
          .text()
          .replace(/[ \t]+/g, " ")
          .replace(/\n{2,}/g, "\n")
          .trim();

  return { title, text: text.slice(0, SITE_ANALYSIS_LIMITS.MAX_CHARS_PER_PAGE) };
}

/**
 * Encontra, entre os links da homepage, candidatos a página de serviços,
 * sobre, cases e contato — só dentro do mesmo domínio (nunca segue link
 * para outro site) e sem duplicar a própria homepage.
 */
export function discoverCandidateLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const found = new Map<string, string>(); // categoria -> URL

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      return;
    }

    // Só considera links para o mesmo host (nunca sai do domínio) e só
    // http/https (descarta mailto:, tel:, javascript:, etc.).
    if (resolved.hostname !== base.hostname) return;
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
    if (resolved.pathname === base.pathname || resolved.pathname === "/") return;

    const haystack = `${resolved.pathname} ${$(el).text()}`.toLowerCase();

    for (const [category, keywords] of Object.entries(PAGE_DISCOVERY_KEYWORDS)) {
      if (found.has(category)) continue;
      if (keywords.some((keyword) => haystack.includes(keyword))) {
        // Remove hash/fragmento; mantém a query só se parecer relevante
        // (na prática, raramente é — mas não custa preservar).
        resolved.hash = "";
        found.set(category, resolved.toString());
        break;
      }
    }
  });

  return Array.from(found.values()).slice(0, SITE_ANALYSIS_LIMITS.MAX_ADDITIONAL_PAGES);
}

/**
 * Remove linhas que se repetem em várias páginas do mesmo site — sinal
 * de que são menu, rodapé ou aviso de cookies, e não conteúdo específico
 * da página (seção 5.3 do BRD: "remover... menus repetidos e conteúdo
 * irrelevante"). Só remove linhas repetidas em pelo menos duas páginas,
 * para não apagar frases curtas legítimas que aparecem por coincidência.
 */
export function removeRepeatedBoilerplate<T extends ExtractedPage>(pages: T[]): T[] {
  if (pages.length <= 1) return pages;

  const lineCounts = new Map<string, number>();
  for (const page of pages) {
    const uniqueLines = new Set(page.text.split("\n").map((line) => line.trim()));
    for (const line of uniqueLines) {
      if (!line) continue;
      lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
    }
  }

  return pages.map((page) => ({
    ...page,
    text: page.text
      .split("\n")
      .filter((line) => (lineCounts.get(line.trim()) ?? 0) < 2)
      .join("\n")
      .trim(),
  }));
}
