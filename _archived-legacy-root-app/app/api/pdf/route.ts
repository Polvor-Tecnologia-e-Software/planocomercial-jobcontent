/**
 * POST /api/pdf
 * Generates PDF, uploads to Supabase Storage, returns signed URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAndStorePDF } from "@/services/pdf/storage";

const ScoreSchema = z.object({
  overall: z.number().int().min(0).max(100),
  demanda: z.number().int().min(0).max(100),
  conversao: z.number().int().min(0).max(100),
  escala: z.number().int().min(0).max(100),
  level: z.string(),
});

const RequestSchema = z.object({
  company_name:  z.string().min(1).max(200),
  email:         z.string().email(),
  diagnostic_id: z.string().uuid().optional(),
  engine:        z.record(z.string(), z.unknown()),
  plan:          z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { company_name, email, diagnostic_id, engine, plan } = parsed.data;

    const result = await generateAndStorePDF({
      engine: engine as unknown as Parameters<typeof generateAndStorePDF>[0]["engine"],
      plan: plan as unknown as Parameters<typeof generateAndStorePDF>[0]["plan"],
      company_name,
      email,
      diagnostic_id,
    });

    if (result.error && !result.mocked) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success:      true,
      storage_path: result.storage_path,
      signed_url:   result.signed_url,
      expires_at:   result.signed_url_exp,
      file_size_kb: result.file_size_kb,
      mocked:       result.mocked,
    });
  } catch (err) {
    console.error("[/api/pdf]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
