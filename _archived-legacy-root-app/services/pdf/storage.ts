/**
 * /services/pdf/storage.ts
 *
 * 1. Renders GrowthPlanPDF to a Buffer using react-pdf
 * 2. Uploads to Supabase Storage bucket "pdf-reports" (private)
 * 3. Creates a signed URL (7 days)
 * 4. Persists record to pdf_reports table
 *
 * Gracefully mocks when Supabase is not configured.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { GrowthPlanPDF } from "./document";
import type { ScoreEngineOutput } from "@/services/score-engine";
import type { GrowthPlan } from "@/services/ai/types";

export interface PDFStorageResult {
  storage_path:   string;
  signed_url:     string;
  signed_url_exp: string; // ISO date
  file_size_kb:   number;
  mocked:         boolean;
  error?:         string;
}

export interface GeneratePDFOptions {
  engine:        ScoreEngineOutput;
  plan:          GrowthPlan;
  company_name:  string;
  email:         string;
  diagnostic_id?: string;
}

const BUCKET       = "pdf-reports";
const SIGNED_TTL   = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── Check if Supabase is configured ─────────────────────────────────────────
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("placeholder") &&
    key.length > 20 &&
    !key.includes("placeholder")
  );
}

// ─── Generate file name ───────────────────────────────────────────────────────
function buildStoragePath(companyName: string): string {
  const slug = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${slug}/${ts}.pdf`;
}

// ─── Mock result (Supabase not configured) ────────────────────────────────────
function mockResult(fileSize: number): PDFStorageResult {
  return {
    storage_path:   "mock/not-uploaded.pdf",
    signed_url:     "",
    signed_url_exp: new Date(Date.now() + SIGNED_TTL * 1000).toISOString(),
    file_size_kb:   Math.round(fileSize / 1024),
    mocked:         true,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateAndStorePDF(
  opts: GeneratePDFOptions
): Promise<PDFStorageResult> {
  const { engine, plan, company_name, email, diagnostic_id } = opts;

  // 1. Render to buffer
  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  let buffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(GrowthPlanPDF as any, {
      engine, plan, companyName: company_name, email, generatedAt,
    });
    buffer = await renderToBuffer(element as any);
  } catch (err) {
    console.error("[pdf/storage] renderToBuffer failed:", err);
    return {
      storage_path:   "",
      signed_url:     "",
      signed_url_exp: "",
      file_size_kb:   0,
      mocked:         false,
      error:          `PDF render failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  console.log(`[pdf/storage] PDF rendered: ${Math.round(buffer.length / 1024)}KB`);

  // 2. Mock if Supabase not configured
  if (!isSupabaseConfigured()) {
    console.log("[pdf/storage] Supabase not configured — mock persist");
    return mockResult(buffer.length);
  }

  // 3. Upload to Supabase Storage
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const storagePath = buildStoragePath(company_name);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType:  "application/pdf",
      cacheControl: "3600",
      upsert:       false,
    });

  if (uploadError) {
    console.error("[pdf/storage] Upload error:", uploadError);
    return {
      storage_path:   storagePath,
      signed_url:     "",
      signed_url_exp: "",
      file_size_kb:   Math.round(buffer.length / 1024),
      mocked:         false,
      error:          `Upload failed: ${uploadError.message}`,
    };
  }

  // 4. Create signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_TTL);

  if (signedError || !signedData?.signedUrl) {
    console.error("[pdf/storage] Signed URL error:", signedError);
    return {
      storage_path:   storagePath,
      signed_url:     "",
      signed_url_exp: "",
      file_size_kb:   Math.round(buffer.length / 1024),
      mocked:         false,
      error:          `Signed URL failed: ${signedError?.message}`,
    };
  }

  const signedUrlExp = new Date(Date.now() + SIGNED_TTL * 1000).toISOString();

  // 5. Persist to pdf_reports table
  if (diagnostic_id) {
    await supabase.from("pdf_reports").insert({
      diagnostic_id,
      storage_path:          storagePath,
      signed_url:            signedData.signedUrl,
      signed_url_expires_at: signedUrlExp,
    });
  }

  console.log(`[pdf/storage] Stored at: ${storagePath}`);

  return {
    storage_path:   storagePath,
    signed_url:     signedData.signedUrl,
    signed_url_exp: signedUrlExp,
    file_size_kb:   Math.round(buffer.length / 1024),
    mocked:         false,
  };
}
