/**
 * POST /api/deliver
 * Orchestrates the full delivery flow:
 * 1. Generate PDF → Supabase Storage → Signed URL
 * 2. Send contact + PDF link to RD Station
 * Returns a combined result for the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAndStorePDF } from "@/services/pdf/storage";
import { sendToRDStation } from "@/services/rd";

const RequestSchema = z.object({
  // Identity
  company_name:  z.string().min(1).max(200),
  email:         z.string().email(),
  phone:         z.string().max(20).optional(),
  job_title:     z.string().max(100).optional(),
  website:       z.string().max(200).optional(),

  // IDs
  diagnostic_id: z.string().uuid().optional(),
  lead_id:       z.string().uuid().optional(),

  // Data blobs (validated loosely — typed in services)
  engine: z.record(z.string(), z.unknown()),
  plan:   z.record(z.string(), z.unknown()),

  // LGPD
  lgpd_consent:    z.boolean(),
  lgpd_consent_at: z.string(),
  lgpd_version:    z.string().default("1.0.0"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // ── Step 1: Generate PDF ──────────────────────────────────────────────────
    console.log(`[/api/deliver] Generating PDF for ${d.company_name}`);
    const pdfResult = await generateAndStorePDF({
      engine:        d.engine as unknown as Parameters<typeof generateAndStorePDF>[0]["engine"],
      plan:          d.plan as unknown as Parameters<typeof generateAndStorePDF>[0]["plan"],
      company_name:  d.company_name,
      email:         d.email,
      diagnostic_id: d.diagnostic_id,
    });

    if (pdfResult.error && !pdfResult.mocked) {
      console.error("[/api/deliver] PDF generation failed:", pdfResult.error);
      // Continue anyway — RD Station can still receive the contact without the PDF
    }

    // ── Step 2: Send to RD Station ────────────────────────────────────────────
    console.log(`[/api/deliver] Sending to RD Station`);
    const rdResult = await sendToRDStation({
      email:           d.email,
      phone:           d.phone,
      job_title:       d.job_title,
      website:         d.website,
      company_name:    d.company_name,
      engine:          d.engine as unknown as Parameters<typeof sendToRDStation>[0]["engine"],
      pdf_url:         pdfResult.signed_url || undefined,
      lgpd_consent:    d.lgpd_consent,
      lgpd_consent_at: d.lgpd_consent_at,
      lgpd_version:    d.lgpd_version,
      lead_id:         d.lead_id,
      diagnostic_id:   d.diagnostic_id,
    });

    // ── Response ──────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      pdf: {
        signed_url:   pdfResult.signed_url,
        storage_path: pdfResult.storage_path,
        file_size_kb: pdfResult.file_size_kb,
        mocked:       pdfResult.mocked,
        error:        pdfResult.error,
      },
      rd: {
        success:  rdResult.success,
        rd_uuid:  rdResult.rd_uuid,
        mocked:   rdResult.mocked,
        log_id:   rdResult.log_id,
        error:    rdResult.error,
      },
    });
  } catch (err) {
    console.error("[/api/deliver]", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
