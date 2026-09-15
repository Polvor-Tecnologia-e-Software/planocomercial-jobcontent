/**
 * Limites da análise automática de site (seção 5.3 e 16.2 do BRD:
 * "Poucas páginas, limite de caracteres, cache por hash e JSON
 * compacto"). Centralizados aqui para fácil ajuste.
 */
export const SITE_ANALYSIS_LIMITS = {
  /** Homepage + até esta quantidade de páginas adicionais descobertas. */
  MAX_ADDITIONAL_PAGES: 4,
  /** Caracteres úteis mantidos por página, após limpeza. */
  MAX_CHARS_PER_PAGE: 6_000,
  /** Caracteres totais enviados à IA (soma de todas as páginas). */
  MAX_TOTAL_CHARS: 16_000,
  /** Tempo máximo (ms) para o processo inteiro de coleta. */
  MAX_CRAWL_DURATION_MS: 20_000,
} as const;

/**
 * Palavras-chave usadas para encontrar as páginas de serviços, soluções,
 * sobre, cases e contato a partir dos links da homepage (seção 5 do
 * BRD). Em português e inglês, para cobrir sites bilíngues.
 */
export const PAGE_DISCOVERY_KEYWORDS: Record<string, string[]> = {
  services: ["servico", "serviços", "service", "solucao", "solução", "solution"],
  about: ["sobre", "about", "quem-somos", "empresa", "company"],
  cases: [
    "case",
    "cases",
    "portfolio",
    "portfólio",
    "clientes",
    "customers",
    "trabalhos",
  ],
  contact: ["contato", "contact", "fale-conosco", "fale conosco"],
};
