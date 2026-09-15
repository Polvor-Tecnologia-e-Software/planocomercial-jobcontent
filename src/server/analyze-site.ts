import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { AiResponseValidationError } from "@/lib/ai/errors";
import { SITE_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/site-analysis-prompt";
import { analyzeSiteContent } from "@/lib/ai/site-analysis";
import type { SiteAnalysisResult } from "@/lib/ai/site-analysis-schema";
import { validateSiteAnalysisResult } from "@/lib/ai/site-analysis-validation";
import { aiReports, siteAnalyses } from "@/lib/database";
import { normalizeWebsite } from "@/lib/database/normalize-website";
import { CrawlFailedException, crawlSite } from "@/lib/site-analysis/crawler";
import type { SiteAnalysisRow } from "@/types/tables";

export type AnalyzeSiteResult =
  | { status: "skipped"; reason: "no_website" }
  | {
      status: "completed";
      siteAnalysisId: string;
      normalizedUrl: string;
      result: SiteAnalysisResult;
      cached: boolean;
    }
  | {
      status: "failed";
      siteAnalysisId: string | null;
      reason: string;
      /**
       * true quando a falha veio da etapa de coleta (crawlSite) por um
       * motivo que indica o endereço em si provavelmente está errado
       * (URL malformada, domínio que não resolve, hostname bloqueado) —
       * diferente de um site real que só falhou por instabilidade,
       * timeout, ou de uma falha da IA na análise. Usado pela UI para
       * sugerir "reiniciar e corrigir o site" em vez do fallback genérico
       * "continuar sem análise" (ver site-analysis-fallback.tsx).
       */
      invalidWebsite: boolean;
    };

const INVALID_WEBSITE_CRAWL_CODES = new Set(["invalid_url", "dns_resolution_failed", "blocked_hostname"]);

/**
 * Garante que a URL tem protocolo antes de tentar buscá-la (o usuário
 * pode ter digitado só "acme.com.br"). A validação de segurança de
 * verdade acontece dentro de safeFetch/crawlSite — isto aqui só ajusta a
 * forma do texto.
 */
function toFetchableUrl(rawWebsite: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(rawWebsite)
    ? rawWebsite
    : `https://${rawWebsite}`;
}

/**
 * Executa a análise automática do site (Tela 2 do BRD) para um
 * diagnóstico: coleta as páginas públicas, verifica cache por hash de
 * conteúdo, chama a IA somente quando necessário, valida a saída por
 * schema e persiste tudo — incluindo tokens, modelo, latência e versão
 * do prompt (seção 20.1 do BRD). Nunca lança para o chamador em caso de
 * falha de coleta ou de IA — sempre retorna um resultado com status
 * "failed"/"skipped", para que a jornada possa seguir sem travar (seção
 * 5.3: "Fallback: falha ou resultado parcial nunca bloqueia a conclusão
 * do diagnóstico").
 */
export async function analyzeSite(params: {
  diagnosticId: string;
  website: string | null;
}): Promise<AnalyzeSiteResult> {
  if (!params.website) {
    return { status: "skipped", reason: "no_website" };
  }

  const normalizedUrl = normalizeWebsite(params.website);
  if (!normalizedUrl) {
    return { status: "skipped", reason: "no_website" };
  }

  let crawl;
  try {
    crawl = await crawlSite(toFetchableUrl(params.website));
  } catch (error) {
    const reason =
      error instanceof CrawlFailedException
        ? error.message
        : "Não foi possível acessar o site para análise.";

    console.error(
      "[analyze-site] Falha ao coletar o site:",
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    );

    const failedRow = await siteAnalyses.createSiteAnalysis({
      diagnostic_id: params.diagnosticId,
      normalized_url: normalizedUrl,
      status: "failed",
      warnings: [reason],
    });

    const invalidWebsite =
      error instanceof CrawlFailedException && INVALID_WEBSITE_CRAWL_CODES.has(error.code);

    return { status: "failed", siteAnalysisId: failedRow.id, reason, invalidWebsite };
  }

  if (crawl.combinedText.trim().length === 0) {
    console.error(
      "[analyze-site] Site coletado, mas sem texto suficiente para analisar:",
      normalizedUrl,
    );

    const failedRow = await siteAnalyses.createSiteAnalysis({
      diagnostic_id: params.diagnosticId,
      normalized_url: normalizedUrl,
      status: "partial",
      content_hash: crawl.contentHash,
      pages: crawl.pages.map((page) => ({ url: page.url, title: page.title })),
      warnings: crawl.warnings,
    });

    return {
      status: "failed",
      siteAnalysisId: failedRow.id,
      reason: "Não encontramos texto suficiente no site para analisar.",
      invalidWebsite: false,
    };
  }

  // Cache: se já existe uma análise válida para essa URL normalizada, esse
  // hash de conteúdo exato, E a mesma versão de prompt/modelo, reaproveita
  // o resultado sem chamar a IA de novo (seção 16.6 do BRD) — exigir
  // prompt_version/model evita reaproveitar para sempre um resultado
  // gerado por um prompt mais fraco de antes (ver comentário em
  // src/lib/database/site-analyses.ts).
  const env = parseServerEnv();
  const cached = await siteAnalyses.findCachedAnalysis(
    normalizedUrl,
    crawl.contentHash,
    SITE_ANALYSIS_PROMPT_VERSION,
    env.AI_MODEL,
  );

  if (cached && cached.result_json) {
    try {
      const validatedResult = validateSiteAnalysisResult(cached.result_json);

      const row = await persistCompletedAnalysis({
        diagnosticId: params.diagnosticId,
        normalizedUrl,
        crawl,
        result: validatedResult,
        model: cached.model,
      });

      await aiReports.createAiReport({
        diagnostic_id: params.diagnosticId,
        report_type: "site_analysis",
        status: "validated",
        model: cached.model,
        prompt_version: cached.prompt_version ?? SITE_ANALYSIS_PROMPT_VERSION,
        input_hash: crawl.contentHash,
        cached: true,
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: 0,
      });

      return {
        status: "completed",
        siteAnalysisId: row.id,
        normalizedUrl,
        result: validatedResult,
        cached: true,
      };
    } catch {
      // Cache corrompido/desatualizado (schema mudou) — cai para chamar
      // a IA de novo, como se fosse cache miss.
    }
  }

  try {
    const aiResult = await analyzeSiteContent(crawl.combinedText);

    const row = await persistCompletedAnalysis({
      diagnosticId: params.diagnosticId,
      normalizedUrl,
      crawl,
      result: aiResult.result,
      model: aiResult.model,
      promptVersion: aiResult.promptVersion,
    });

    await aiReports.createAiReport({
      diagnostic_id: params.diagnosticId,
      report_type: "site_analysis",
      status: "validated",
      model: aiResult.model,
      prompt_version: aiResult.promptVersion,
      input_hash: crawl.contentHash,
      cached: false,
      input_tokens: aiResult.inputTokens,
      output_tokens: aiResult.outputTokens,
      latency_ms: aiResult.latencyMs,
    });

    return {
      status: "completed",
      siteAnalysisId: row.id,
      normalizedUrl,
      result: aiResult.result,
      cached: false,
    };
  } catch (error) {
    const reason =
      error instanceof AiResponseValidationError
        ? "A IA retornou um resultado inválido para este site."
        : "Não foi possível concluir a análise do site agora.";

    console.error(
      "[analyze-site] Falha ao analisar o conteúdo com a IA:",
      error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      // AiCallError guarda o erro de transporte original em .cause — sem
      // isso, mensagens genéricas como "Falha na chamada de IA." escondem
      // a causa real (chave inválida, rede, limite de taxa, etc.).
      error && typeof error === "object" && "cause" in error
        ? `| causa: ${error.cause instanceof Error ? `${error.cause.name}: ${error.cause.message}` : String(error.cause)}`
        : "",
    );

    const failedRow = await siteAnalyses.createSiteAnalysis({
      diagnostic_id: params.diagnosticId,
      normalized_url: normalizedUrl,
      status: "failed",
      content_hash: crawl.contentHash,
      pages: crawl.pages.map((page) => ({ url: page.url, title: page.title })),
      warnings: [...crawl.warnings, reason],
    });

    await aiReports.createAiReport({
      diagnostic_id: params.diagnosticId,
      report_type: "site_analysis",
      status: "failed",
      prompt_version: SITE_ANALYSIS_PROMPT_VERSION,
      input_hash: crawl.contentHash,
      cached: false,
    });

    return { status: "failed", siteAnalysisId: failedRow.id, reason, invalidWebsite: false };
  }
}

async function persistCompletedAnalysis(params: {
  diagnosticId: string;
  normalizedUrl: string;
  crawl: {
    pages: { url: string; title: string }[];
    contentHash: string;
    warnings: string[];
  };
  result: SiteAnalysisResult;
  model: string | null;
  promptVersion?: string;
}): Promise<SiteAnalysisRow> {
  return siteAnalyses.createSiteAnalysis({
    diagnostic_id: params.diagnosticId,
    normalized_url: params.normalizedUrl,
    status: "completed",
    content_hash: params.crawl.contentHash,
    // Nunca o HTML/texto integral — só o resumo estruturado validado
    // pelo schema e os metadados de página (URL e título).
    result_json: params.result,
    pages: params.crawl.pages.map((page) => ({ url: page.url, title: page.title })),
    warnings: params.crawl.warnings,
    model: params.model,
    prompt_version: params.promptVersion ?? SITE_ANALYSIS_PROMPT_VERSION,
    confidence: params.result.confidence,
  });
}
