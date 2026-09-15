import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  email: z.string().email(),
  company_name: z.string().min(1).max(200),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  growth_score: z.number().int().min(0).max(100),
  score_demanda: z.number().int().min(0).max(100),
  score_conversao: z.number().int().min(0).max(100),
  score_escala: z.number().int().min(0).max(100),
  gargalo_principal: z.string(),
  pdf_link: z.string().url().optional(),
  lgpd_consent: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const token = process.env.RD_STATION_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "RD Station não configurado" }, { status: 503 });
    }

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const data = parsed.data;

    const rdPayload = {
      contact: {
        email: data.email,
        name: data.company_name,
        job_title: data.job_title,
        mobile_phone: data.phone,
        website: data.website || undefined,
        cf_company: data.company_name,
        cf_growth_score: String(data.growth_score),
        cf_score_demanda: String(data.score_demanda),
        cf_score_conversao: String(data.score_conversao),
        cf_score_escala: String(data.score_escala),
        cf_gargalo_principal: data.gargalo_principal,
        ...(data.pdf_link && { cf_link_plano_comercial: data.pdf_link }),
        ...(data.lgpd_consent && {
          legal_bases: [
            { category: "communications", type: "consent", status: "granted" },
            { category: "data_processing", type: "consent", status: "granted" },
          ],
        }),
      },
    };

    const response = await fetch("https://api.rd.services/platform/contacts", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rdPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/rd-station] RD error:", response.status, errorText);
      return NextResponse.json({ error: "Falha na integração com RD Station" }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, rd_uuid: result.uuid });
  } catch (error) {
    console.error("[/api/rd-station] Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
