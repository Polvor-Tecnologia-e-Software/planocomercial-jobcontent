import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { AiResponseValidationError } from "@/lib/ai/errors";
import { SEO_KEYWORDS_PROMPT_VERSION } from "@/lib/ai/seo-keywords-prompt";
import { generateSeoKeywordSuggestions } from "@/lib/ai/seo-keywords";
import { hashContent } from "@/lib/site-analysis/hash";
import { companies, diagnostics, seoAnalyses } from "@/lib/database";
import { flagCoverageGaps, type KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import { rankKeywordOpportunities } from "@/lib/seo/keyword-opportunity";
import type { CompanyRow } from "@/types/tables";

export type AnalyzeSeoResult =
  | { status: "skipped"; reason: "no_keywords" | "diagnostic_not_found" }
  | { status: "completed"; seoAnalysisId: string; keywordIdeas: KeywordOpportunity[]; cached: boolean }
  | { status: "failed"; seoAnalysisId: string | null; reason: string };

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/**
 * Junta o perfil confirmado da empresa (Tela de confirmação da análise de
 * site) num único texto — usado tanto no prompt da IA (contexto do
 * negócio) quanto para comparar cobertura de palavra-chave (ver
 * src/lib/seo/keyword-coverage.ts).
 */
function buildCompanyProfileText(company: CompanyRow | null): string {
  if (!company) return "";
  return [
    company.description,
    company.main_offer,
    company.target_audience,
    ...readStringArray(company.differentiators),
    ...readStringArray(company.commercial_proofs),
    ...readStringArray(company.conversion_mechanisms),
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

/**
 * Sugere oportunidades de SEO a partir das palavras-chave informadas na
 * captura (companies.keywords) usando IA — volume de busca e
 * concorrência são ESTIMATIVAS da IA, não dado real do Google (ver
 * src/lib/ai/seo-keywords-prompt.ts; a interface rotula isso
 * explicitamente, nunca apresenta como número exato). Descontinuou a
 * integração com o Google Ads Keyword Planner (docs/CHECKLIST-GOOGLE-ADS.md,
 * removido) por decisão do usuário — o ranqueamento
 * (src/lib/seo/keyword-opportunity.ts) e a marcação de cobertura
 * (src/lib/seo/keyword-coverage.ts) continuam 100% determinísticos, só a
 * origem dos números de entrada mudou.
 *
 * Best-effort, igual a analyze-site.ts e send-rd-station-conversion.ts:
 * sem palavras-chave informadas, a seção de SEO simplesmente não aparece
 * — nunca bloqueia o restante do diagnóstico. Cache por hash (palavras-
 * chave + site + perfil + versão do prompt + modelo), mesma lógica de
 * site_analyses/commercial-plan.
 */
export async function analyzeSeoOpportunities(diagnosticId: string): Promise<AnalyzeSeoResult> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "skipped", reason: "diagnostic_not_found" };

  const company = await companies.getCompanyById(diagnostic.company_id);
  const keywords = readStringArray(company?.keywords);
  if (keywords.length === 0) {
    return { status: "skipped", reason: "no_keywords" };
  }

  const normalizedWebsite = company?.normalized_website ?? null;
  const profileText = buildCompanyProfileText(company);
  const env = parseServerEnv();
  const contentHash = hashContent(
    JSON.stringify({
      keywords: [...keywords].sort(),
      site: normalizedWebsite,
      profileText,
      promptVersion: SEO_KEYWORDS_PROMPT_VERSION,
      model: env.AI_MODEL,
    }),
  );

  const cached = await seoAnalyses.findCachedAnalysis(diagnosticId, contentHash);
  if (cached) {
    return {
      status: "completed",
      seoAnalysisId: cached.id,
      keywordIdeas: Array.isArray(cached.keyword_ideas)
        ? (cached.keyword_ideas as KeywordOpportunity[])
        : [],
      cached: true,
    };
  }

  try {
    const aiResult = await generateSeoKeywordSuggestions({
      seedKeywords: keywords,
      companyProfileText: profileText,
    });

    const ranked = rankKeywordOpportunities(
      aiResult.suggestions.map((suggestion) => ({
        keyword: suggestion.keyword,
        avgMonthlySearches: suggestion.estimatedMonthlySearches,
        competition: suggestion.competition,
      })),
    );
    // Cruza com o perfil confirmado da empresa para sinalizar quais
    // oportunidades o site ainda não parece cobrir (ver
    // src/lib/seo/keyword-coverage.ts) — nunca reordena por isso, só
    // marca; o rank continua refletindo volume × concorrência.
    const withCoverage = flagCoverageGaps(ranked, profileText);

    const row = await seoAnalyses.createSeoAnalysis({
      diagnostic_id: diagnosticId,
      status: "completed",
      content_hash: contentHash,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- coluna jsonb, tipada como unknown no Insert.
      keyword_ideas: withCoverage as any,
    });

    return { status: "completed", seoAnalysisId: row.id, keywordIdeas: withCoverage, cached: false };
  } catch (err) {
    const reason =
      err instanceof AiResponseValidationError
        ? "A IA retornou um resultado inválido para as palavras-chave."
        : "Não foi possível gerar sugestões de SEO agora.";

    // Só um resumo — nunca o erro bruto do SDK (pode incluir cabeçalhos de
    // requisição). AiCallError guarda a causa de transporte original em
    // .cause (ex.: "429 Your account is not active..."), sem a qual a
    // mensagem genérica "Falha na chamada de IA." esconde o motivo real.
    console.error(
      "[analyze-seo-opportunities] Falha:",
      err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      err && typeof err === "object" && "cause" in err
        ? `| causa: ${err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : String(err.cause)}`
        : "",
    );

    const failedRow = await seoAnalyses.createSeoAnalysis({
      diagnostic_id: diagnosticId,
      status: "failed",
      content_hash: contentHash,
      warnings: [reason],
    });

    return { status: "failed", seoAnalysisId: failedRow.id, reason };
  }
}
