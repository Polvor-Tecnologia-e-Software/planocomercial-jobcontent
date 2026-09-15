import "server-only";

import { parseServerEnv } from "@/config/env.server";
import { generateCommercialPlanContent } from "@/lib/ai/commercial-plan";
import { COMMERCIAL_PLAN_PROMPT_VERSION } from "@/lib/ai/commercial-plan-prompt";
import { AiResponseValidationError } from "@/lib/ai/errors";
import { findUngroundedNumbers, UngroundedNumberError } from "@/lib/ai/numeric-guard";
import { hashContent } from "@/lib/site-analysis/hash";
import { aiReports, diagnostics } from "@/lib/database";
import { buildCommercialPlanContext } from "@/server/build-commercial-plan-context";
import { CommercialPlanSchema, type CommercialPlan } from "@/schemas/commercial-plan";

/** Tentativas top-level (cada uma pode envolver até 2 chamadas de rede — ver retry em src/lib/ai/client.ts) permitidas por diagnóstico, só para relatórios do tipo "diagnostic_plan". */
const MAX_ATTEMPTS_PER_DIAGNOSTIC = 3;

export type GenerateCommercialPlanResult =
  | { status: "skipped"; reason: "diagnostic_not_found" | "challenge_not_selected" }
  | { status: "cached"; plan: CommercialPlan; reportId: string }
  | { status: "generated"; plan: CommercialPlan; reportId: string }
  | {
      status: "failed";
      reason: "invalid_output" | "transport_error" | "too_many_attempts";
      reportId: string | null;
    };

function classifyFailure(err: unknown): "invalid_output" | "transport_error" {
  if (err instanceof UngroundedNumberError) return "invalid_output";
  if (err instanceof AiResponseValidationError) return "invalid_output";
  return "transport_error"; // AiCallError (timeout/rede/indisponibilidade) ou qualquer outra falha inesperada
}

/**
 * Gera (ou reaproveita do cache) o plano comercial de 90 dias para um
 * diagnóstico. A IA só INTERPRETA os dados já calculados
 * deterministicamente nas etapas anteriores — nunca recalcula nada.
 *
 * Cache: o hash de entrada inclui o AIContext inteiro + a versão do
 * prompt + o modelo configurado — se qualquer um dos três mudar, o hash
 * muda e o cache não bate, então uma resposta antiga nunca é servida por
 * engano. Se bater, retorna sem gastar token nenhum (cached: true).
 *
 * Nunca perde o diagnóstico: qualquer falha (JSON inválido, número não
 * rastreável ao contexto, timeout, indisponibilidade) grava um
 * ai_reports com status "failed" e retorna um motivo — quem chama pode
 * tentar de novo mais tarde (a próxima chamada é uma tentativa nova,
 * IDs diferentes, sujeita ao mesmo limite de tentativas). Nunca lança.
 */
export async function generateCommercialPlan(diagnosticId: string): Promise<GenerateCommercialPlanResult> {
  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) return { status: "skipped", reason: "diagnostic_not_found" };
  if (!diagnostic.selected_challenge) return { status: "skipped", reason: "challenge_not_selected" };

  const context = await buildCommercialPlanContext(diagnosticId);
  if (!context) return { status: "skipped", reason: "challenge_not_selected" };

  const env = parseServerEnv();
  const contextJson = JSON.stringify(context);
  const inputHash = hashContent(
    JSON.stringify({ context, promptVersion: COMMERCIAL_PLAN_PROMPT_VERSION, model: env.AI_MODEL }),
  );

  const cached = await aiReports.findCachedReport("diagnostic_plan", inputHash);
  if (cached?.response_json) {
    const validated = CommercialPlanSchema.safeParse(cached.response_json);
    if (validated.success) {
      return { status: "cached", plan: validated.data, reportId: cached.id };
    }
    // Cache corrompido ou de um formato antigo sem versão nova o
    // suficiente para invalidar o hash — trata como cache miss e segue
    // para gerar de novo.
  }

  const attemptsSoFar = await aiReports.countReportsForDiagnostic(diagnosticId, "diagnostic_plan");
  if (attemptsSoFar >= MAX_ATTEMPTS_PER_DIAGNOSTIC) {
    return { status: "failed", reason: "too_many_attempts", reportId: null };
  }

  const report = await aiReports.createAiReport({
    diagnostic_id: diagnosticId,
    report_type: "diagnostic_plan",
    status: "generating",
    model: env.AI_MODEL,
    prompt_version: COMMERCIAL_PLAN_PROMPT_VERSION,
    input_hash: inputHash,
    cached: false,
  });

  try {
    const callResult = await generateCommercialPlanContent(context);

    const ungrounded = findUngroundedNumbers(callResult.plan, contextJson);
    if (ungrounded.length > 0) {
      throw new UngroundedNumberError(ungrounded);
    }

    await aiReports.updateAiReportStatus(report.id, "validated", {
      response_json: callResult.plan,
      input_tokens: callResult.inputTokens,
      output_tokens: callResult.outputTokens,
      latency_ms: callResult.latencyMs,
    });

    return { status: "generated", plan: callResult.plan, reportId: report.id };
  } catch (err) {
    // Só nome + mensagem no log — nunca o objeto de erro bruto do SDK
    // (pode carregar cabeçalhos de requisição) nem qualquer segredo.
    const errorSummary = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[generate-commercial-plan] Falha ao gerar plano:", errorSummary);
    const reason = classifyFailure(err);
    // Só o motivo classificado (um dos poucos valores fixos abaixo) é
    // persistido — nunca a mensagem bruta do erro, que poderia incluir
    // detalhes internos do SDK.
    await aiReports.updateAiReportStatus(report.id, "failed", { last_error: reason });
    return { status: "failed", reason, reportId: report.id };
  }
}
