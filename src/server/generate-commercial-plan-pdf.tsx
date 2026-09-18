import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { renderToBuffer } from "@react-pdf/renderer";

import {
  CommercialPlanDocument,
  PDF_TEMPLATE_VERSION,
} from "@/lib/pdf/commercial-plan-document";
import { hashContent } from "@/lib/site-analysis/hash";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { pdfReports } from "@/lib/database";
import { getCommercialPlanResult } from "@/server/get-commercial-plan-result";

const BUCKET = "pdf-reports";
/** URL assinada de curta duração — só o suficiente para o download imediato do clique, gerada sob demanda a cada pedido (nunca persistida). */
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora
/** Acima disso, um PDF "generating" é tratado como travado (upload/render provavelmente morreu no meio) e uma nova tentativa é permitida. */
const STALE_GENERATING_MS = 45_000;

export type GenerateCommercialPlanPdfResult =
  | { status: "skipped"; reason: "diagnostic_not_found" | "plan_not_ready" }
  | { status: "generating" }
  | { status: "ready"; url: string; version: number }
  | { status: "failed"; reason: "render_failed" | "upload_failed" | "signed_url_failed" };

function isStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > STALE_GENERATING_MS;
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function createSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("[generate-commercial-plan-pdf] Falha ao criar signed URL:", error?.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Gera (ou reaproveita) o PDF do plano comercial de um diagnóstico.
 * Nunca chama IA — o conteúdo já existe (getCommercialPlanResult, mesma
 * função que alimenta a tela de resultado). O bucket `pdf-reports` é
 * PRIVADO: todo acesso ao arquivo passa por uma signed URL de curta
 * duração, gerada sob demanda, nunca por um link público direto.
 *
 * Cache: um hash do conteúdo (plano + funil + versão do template) decide
 * se o PDF já existente ainda é válido — se bater, não renderiza nem
 * envia nada de novo, só assina uma nova URL para o arquivo que já
 * existe. Se o conteúdo mudou, uma nova versão é gravada (nunca sobrescreve
 * a antiga silenciosamente — `version` incrementa).
 *
 * Concorrência: se já existe uma geração "generating" recente para o
 * mesmo diagnóstico, não inicia uma segunda em paralelo (evita gerar
 * duas vezes por clique duplo ou duas abas abertas) — devolve o estado
 * "generating" para o chamador esperar/tentar de novo em instantes.
 */
export async function generateCommercialPlanPdf(
  diagnosticId: string,
): Promise<GenerateCommercialPlanPdfResult> {
  const result = await getCommercialPlanResult(diagnosticId);

  if (result.status === "not_found") {
    return { status: "skipped", reason: "diagnostic_not_found" };
  }
  if (result.status !== "completed") {
    return { status: "skipped", reason: "plan_not_ready" };
  }

  const reportHash = hashContent(
    JSON.stringify({
      plan: result.plan,
      funnelStages: result.funnelStages,
      primaryBottleneck: result.primaryBottleneck,
      dataQualityPercentage: result.dataQualityPercentage,
      confidence: result.confidence,
      seoOpportunities: result.seoOpportunities,
      templateVersion: PDF_TEMPLATE_VERSION,
    }),
  );

  const latest = await pdfReports.getLatestPdfReport(diagnosticId);

  if (
    latest &&
    latest.status === "available" &&
    latest.report_hash === reportHash &&
    latest.template_version === PDF_TEMPLATE_VERSION
  ) {
    const url = await createSignedUrl(latest.storage_path);
    if (!url) return { status: "failed", reason: "signed_url_failed" };
    return { status: "ready", url, version: latest.version };
  }

  if (latest && latest.status === "generating" && !isStale(latest.created_at)) {
    return { status: "generating" };
  }

  // Caminho de storage nunca usa dado do usuário (nome da empresa, etc.)
  // — só o diagnosticId (UUID já validado pela camada que chama esta
  // função) e um UUID novo gerado aqui, sempre relativo à raiz do bucket
  // (o nome do bucket não entra no path).
  const storagePath = `${diagnosticId}/${randomUUID()}.pdf`;
  const nextVersion = (latest?.version ?? 0) + 1;

  const pdfReportRow = await pdfReports.createPdfReport({
    diagnostic_id: diagnosticId,
    storage_path: storagePath,
    report_hash: reportHash,
    template_version: PDF_TEMPLATE_VERSION,
    version: nextVersion,
    status: "generating",
  });

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      <CommercialPlanDocument
        companyName={result.companyName}
        generatedAt={result.generatedAt}
        plan={result.plan}
        funnelStages={result.funnelStages}
        primaryBottleneck={result.primaryBottleneck}
        dataQualityPercentage={result.dataQualityPercentage}
        confidence={result.confidence}
        seoOpportunities={result.seoOpportunities}
      />,
    );
  } catch (err) {
    console.error("[generate-commercial-plan-pdf] Falha ao renderizar PDF:", err instanceof Error ? err.message : err);
    await pdfReports.updatePdfReportStatus(pdfReportRow.id, "failed");
    return { status: "failed", reason: "render_failed" };
  }

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    console.error("[generate-commercial-plan-pdf] Falha no upload:", uploadError.message);
    await pdfReports.updatePdfReportStatus(pdfReportRow.id, "failed");
    return { status: "failed", reason: "upload_failed" };
  }

  await pdfReports.updatePdfReportStatus(pdfReportRow.id, "available", {
    file_hash: hashBuffer(buffer),
    file_size: buffer.length,
  });

  const url = await createSignedUrl(storagePath);
  if (!url) return { status: "failed", reason: "signed_url_failed" };

  return { status: "ready", url, version: nextVersion };
}
