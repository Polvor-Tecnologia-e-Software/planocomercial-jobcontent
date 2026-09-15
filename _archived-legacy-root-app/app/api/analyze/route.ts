import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runScoreEngine } from "@/services/score-engine";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import type { DiagnosticAnswer } from "@/types";

const AnswerSchema = z.object({
  question_id: z.string().min(1).max(20),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
  score: z.number().min(0).max(10),
});

const RequestSchema = z.object({
  company_name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  answers: z.array(AnswerSchema).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { answers, company_name } = parsed.data;
    const typedAnswers = answers as DiagnosticAnswer[];

    // Run full deterministic score engine (no AI)
    const engineOutput = runScoreEngine(typedAnswers, DIAGNOSTIC_QUESTIONS);

    return NextResponse.json({
      success: true,
      company_name,
      engine: engineOutput,
    });
  } catch (error) {
    console.error("[/api/analyze] Error:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
