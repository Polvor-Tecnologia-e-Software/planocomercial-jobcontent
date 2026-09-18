import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestPdfReport = vi.fn();
const createPdfReport = vi.fn();
const updatePdfReportStatus = vi.fn();
const getCommercialPlanResult = vi.fn();
const renderToBuffer = vi.fn();
const storageUpload = vi.fn();
const storageCreateSignedUrl = vi.fn();

vi.mock("@/lib/database", () => ({
  pdfReports: { getLatestPdfReport, createPdfReport, updatePdfReportStatus },
}));

vi.mock("@/server/get-commercial-plan-result", () => ({ getCommercialPlanResult }));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer,
  // Componentes usados só como tags JSX pelo módulo do documento — não
  // importamos o documento real aqui (mockamos renderToBuffer inteiro),
  // então não precisam de implementação de verdade.
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: {
      from: () => ({
        upload: storageUpload,
        createSignedUrl: storageCreateSignedUrl,
      }),
    },
  }),
}));

const { generateCommercialPlanPdf } = await import("@/server/generate-commercial-plan-pdf");

function completedResult(overrides: Record<string, unknown> = {}) {
  return {
    status: "completed" as const,
    diagnosticId: "diagnostic-1",
    companyName: "CodeBit",
    generatedAt: "2026-01-05T00:00:00.000Z",
    plan: { executiveDiagnosis: "Diagnóstico." },
    funnelStages: [],
    primaryBottleneck: "conversion" as const,
    secondaryRisk: null,
    dataQualityPercentage: 60,
    confidence: "medium" as const,
    seoOpportunities: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createPdfReport.mockResolvedValue({ id: "pdf-1" });
  updatePdfReportStatus.mockResolvedValue({ id: "pdf-1" });
  renderToBuffer.mockResolvedValue(Buffer.from("%PDF-1.7 fake content"));
  storageUpload.mockResolvedValue({ error: null });
  storageCreateSignedUrl.mockResolvedValue({ data: { signedUrl: "https://storage.example/signed" }, error: null });
});

describe("generateCommercialPlanPdf — acesso indevido / pré-condições", () => {
  it("skipped quando o diagnóstico não existe", async () => {
    getCommercialPlanResult.mockResolvedValue({ status: "not_found" });
    const result = await generateCommercialPlanPdf("inexistente");
    expect(result).toEqual({ status: "skipped", reason: "diagnostic_not_found" });
    expect(renderToBuffer).not.toHaveBeenCalled();
  });

  it("skipped quando o plano ainda não está pronto (ex.: not_generated)", async () => {
    getCommercialPlanResult.mockResolvedValue({
      status: "not_generated",
      diagnosticId: "diagnostic-1",
      companyName: "CodeBit",
    });
    const result = await generateCommercialPlanPdf("diagnostic-1");
    expect(result).toEqual({ status: "skipped", reason: "plan_not_ready" });
    expect(renderToBuffer).not.toHaveBeenCalled();
  });
});

describe("generateCommercialPlanPdf — path/segurança", () => {
  it("nunca usa dados do usuário (nome da empresa) no storage_path — só diagnosticId + UUID gerado", async () => {
    getCommercialPlanResult.mockResolvedValue(
      completedResult({ companyName: "Empresa Com Espaço & Símbolos Ltda." }),
    );
    getLatestPdfReport.mockResolvedValue(null);

    await generateCommercialPlanPdf("diagnostic-1");

    const [storagePath] = storageUpload.mock.calls[0];
    expect(storagePath.startsWith("diagnostic-1/")).toBe(true);
    expect(storagePath).not.toContain("Empresa");
    expect(storagePath).not.toContain(" ");
    expect(storagePath).toMatch(/^diagnostic-1\/[0-9a-f-]{36}\.pdf$/);
  });
});

describe("generateCommercialPlanPdf — cache e versionamento", () => {
  it("reaproveita o PDF existente (mesmo hash) sem renderizar/subir de novo", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    const reportHash = computeExpectedHash(completedResult());
    getLatestPdfReport.mockResolvedValue({
      id: "pdf-old",
      storage_path: "diagnostic-1/existing.pdf",
      report_hash: reportHash,
      template_version: "commercial-plan-pdf-v11",
      version: 3,
      status: "available",
    });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(renderToBuffer).not.toHaveBeenCalled();
    expect(storageUpload).not.toHaveBeenCalled();
    expect(storageCreateSignedUrl).toHaveBeenCalledWith("diagnostic-1/existing.pdf", expect.any(Number));
    expect(result).toEqual({ status: "ready", url: "https://storage.example/signed", version: 3 });
  });

  it("gera uma nova versão quando o plano mudou (hash diferente)", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue({
      id: "pdf-old",
      storage_path: "diagnostic-1/existing.pdf",
      report_hash: "hash-de-uma-versao-anterior-diferente",
      template_version: "commercial-plan-pdf-v11",
      version: 2,
      status: "available",
    });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(renderToBuffer).toHaveBeenCalledTimes(1);
    expect(createPdfReport).toHaveBeenCalledWith(expect.objectContaining({ version: 3 }));
    if (result.status === "ready") expect(result.version).toBe(3);
  });

  it("primeira geração começa na versão 1", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue(null);

    await generateCommercialPlanPdf("diagnostic-1");

    expect(createPdfReport).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }));
  });
});

describe("generateCommercialPlanPdf — geração duplicada / concorrência", () => {
  it("não inicia uma segunda geração quando já existe uma 'generating' recente (evita clique duplo)", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue({
      id: "pdf-in-flight",
      storage_path: "diagnostic-1/in-flight.pdf",
      report_hash: "qualquer",
      template_version: "commercial-plan-pdf-v11",
      version: 1,
      status: "generating",
      created_at: new Date().toISOString(),
    });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(result).toEqual({ status: "generating" });
    expect(renderToBuffer).not.toHaveBeenCalled();
    expect(createPdfReport).not.toHaveBeenCalled();
  });

  it("trata uma 'generating' antiga/travada como reiniciável (não trava para sempre)", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue({
      id: "pdf-stuck",
      storage_path: "diagnostic-1/stuck.pdf",
      report_hash: "qualquer",
      template_version: "commercial-plan-pdf-v11",
      version: 1,
      status: "generating",
      created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(renderToBuffer).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("ready");
  });
});

describe("generateCommercialPlanPdf — falhas", () => {
  beforeEach(() => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue(null);
  });

  it("Storage indisponível no upload -> failed, marca o relatório como failed, não perde o diagnóstico", async () => {
    storageUpload.mockResolvedValue({ error: { message: "bucket indisponível" } });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "upload_failed" });
    expect(updatePdfReportStatus).toHaveBeenCalledWith("pdf-1", "failed");
  });

  it("falha ao renderizar o PDF -> failed, sem tentar upload", async () => {
    renderToBuffer.mockRejectedValue(new Error("falha de renderização"));

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "render_failed" });
    expect(storageUpload).not.toHaveBeenCalled();
  });

  it("falha ao criar a signed URL após upload bem-sucedido -> failed", async () => {
    storageCreateSignedUrl.mockResolvedValue({ data: null, error: { message: "erro" } });

    const result = await generateCommercialPlanPdf("diagnostic-1");

    expect(result).toEqual({ status: "failed", reason: "signed_url_failed" });
  });
});

describe("generateCommercialPlanPdf — signed URL", () => {
  it("usa uma duração curta e finita (nunca uma URL permanente/pública)", async () => {
    getCommercialPlanResult.mockResolvedValue(completedResult());
    getLatestPdfReport.mockResolvedValue(null);

    await generateCommercialPlanPdf("diagnostic-1");

    const [, ttlSeconds] = storageCreateSignedUrl.mock.calls[0];
    expect(ttlSeconds).toBeGreaterThan(0);
    expect(ttlSeconds).toBeLessThanOrEqual(24 * 60 * 60);
  });
});

// Réplica mínima do hash usado pelo orquestrador, só para montar um
// cache HIT determinístico nos testes acima (mesma lógica de
// src/server/generate-commercial-plan-pdf.tsx).
function computeExpectedHash(result: ReturnType<typeof completedResult>): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        plan: result.plan,
        funnelStages: result.funnelStages,
        primaryBottleneck: result.primaryBottleneck,
        dataQualityPercentage: result.dataQualityPercentage,
        confidence: result.confidence,
        seoOpportunities: result.seoOpportunities,
        templateVersion: "commercial-plan-pdf-v11",
      }),
      "utf-8",
    )
    .digest("hex");
}
