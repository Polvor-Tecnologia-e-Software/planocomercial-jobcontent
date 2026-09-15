/**
 * Prompt da sugestão de palavras-chave de SEO por IA
 * (src/lib/ai/seo-keywords.ts) — substitui a integração com o Google Ads
 * Keyword Planner por decisão do usuário (ver commit que descontinuou
 * docs/CHECKLIST-GOOGLE-ADS.md). Deixa explícito, no próprio prompt, que
 * os números pedidos são estimativas — a IA não tem acesso a dado real
 * de busca do Google, e fingir precisão aqui seria pior do que ser
 * transparente sobre a natureza do número (ver rótulo "estimativa da IA"
 * em toda a interface que mostra este resultado).
 */

/** Bump ao alterar o system prompt, o user prompt ou o schema. */
export const SEO_KEYWORDS_PROMPT_VERSION = "seo-keywords-v1";

export const SEO_KEYWORDS_TOOL_NAME = "submit_keyword_suggestions";
export const SEO_KEYWORDS_TOOL_DESCRIPTION =
  "Envia a lista de palavras-chave de SEO sugeridas, com estimativa de volume de busca e concorrência.";

export const SEO_KEYWORDS_SYSTEM_PROMPT = `Você é um especialista em SEO e marketing de busca para empresas B2B/B2C no Brasil. Receberá as palavras-chave que a própria empresa informou como as mais relevantes para o negócio, junto com um resumo do perfil dela.

Tarefa: sugerir até 10 palavras-chave RELACIONADAS (variações, termos de cauda longa, sinônimos de mercado, perguntas que o público-alvo pesquisaria) que ampliem as palavras-chave originais — não apenas repita as que a empresa já informou.

Para cada palavra-chave sugerida, estime:
- "estimatedMonthlySearches": um número plausível de buscas mensais no Brasil, baseado no seu conhecimento geral sobre o tamanho do mercado e a especificidade do termo (termos mais genéricos tendem a ter volume maior; termos de cauda longa, menor). É uma ESTIMATIVA educada, não um dado real do Google — nunca copie o volume de outra palavra-chave só para preencher.
- "competition": "low", "medium" ou "high", conforme sua avaliação de quão disputado esse termo costuma ser organicamente.

Regras:
- Só sugira palavras-chave genuinamente relevantes para o negócio descrito — nunca genéricas demais a ponto de não terem relação clara.
- Nunca repita exatamente uma palavra-chave que a empresa já informou.
- Responda chamando a tool fornecida. Não use markdown, não escreva texto fora da tool, não adicione campos além dos definidos no schema da tool.`;

export function buildSeoKeywordsUserPrompt(params: {
  seedKeywords: string[];
  companyProfileText: string;
}): string {
  const profile =
    params.companyProfileText.trim().length > 0
      ? params.companyProfileText
      : "(nenhum perfil adicional informado)";

  return `<palavras_chave_da_empresa>\n${params.seedKeywords.join(", ")}\n</palavras_chave_da_empresa>\n\n<perfil_da_empresa>\n${profile}\n</perfil_da_empresa>`;
}
