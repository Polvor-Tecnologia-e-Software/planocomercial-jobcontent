"use server";

import { redirect } from "next/navigation";

import { DatabaseError } from "@/lib/database";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { startDiagnosticSchema } from "@/lib/validation/start-diagnostic";
import { startDiagnostic } from "@/server/start-diagnostic";

/** No máximo 5 novos diagnósticos por IP a cada 10 minutos (seção 19 do BRD:
 * limitar abuso do formulário público, que dispara custo de IA e de crawl). */
const RATE_LIMIT = { limit: 5, windowSeconds: 600 };

type FieldName = "name" | "companyName" | "website" | "email" | "keywords";

// Só o tipo é exportado daqui — um arquivo "use server" só pode exportar
// funções async (confirmado por erro de build real nesta versão do
// Next.js: nem `maxDuration` é aceito aqui — precisa ir na página, ver
// src/app/diagnostico/[diagnosticId]/page.tsx). Um export de tipo é
// apagado na compilação (nunca vira um export em tempo de execução),
// então não viola essa regra. Já um export const de valor violaria —
// por isso initialStartDiagnosticState mora em
// start-diagnostic-initial-state.ts, não aqui.
export type StartDiagnosticActionState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<FieldName, string>>;
  formError?: string;
};

/**
 * Server Action da primeira captura da jornada (Tela 2 do BRD).
 *
 * Fica deliberadamente "fina": só extrai o FormData, valida com Zod e
 * delega a criação de dados para startDiagnostic() (src/server/start-diagnostic.ts).
 * Compatível com useActionState no cliente (src/components/diagnostic/capture-form.tsx).
 */
export async function startDiagnosticAction(
  _previousState: StartDiagnosticActionState,
  formData: FormData,
): Promise<StartDiagnosticActionState> {
  const parsed = startDiagnosticSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    website: formData.get("website"),
    email: formData.get("email"),
    keywords: formData.get("keywords"),
    utmSource: formData.get("utm_source"),
    utmMedium: formData.get("utm_medium"),
    utmCampaign: formData.get("utm_campaign"),
    utmContent: formData.get("utm_content"),
    utmTerm: formData.get("utm_term"),
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<FieldName, string>> = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "companyName" || key === "website" || key === "email" || key === "keywords") {
        // Mantém a primeira mensagem por campo.
        fieldErrors[key] ??= issue.message;
      }
    }

    return { status: "error", fieldErrors };
  }

  // Limita quantos diagnósticos um mesmo IP pode iniciar por janela de
  // tempo — cada envio dispara, na próxima tela, uma análise de site
  // (crawl + chamada de IA), então este é o ponto certo para conter abuso
  // do formulário público antes que ele vire custo.
  const clientIp = await getClientIp();
  const rateLimit = await checkRateLimit({
    action: "start_diagnostic",
    identifier: clientIp,
    ...RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      formError: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
    };
  }

  let diagnosticId: string;

  try {
    const diagnostic = await startDiagnostic({
      name: parsed.data.name,
      companyName: parsed.data.companyName,
      website: parsed.data.website,
      email: parsed.data.email,
      keywords: parsed.data.keywords,
      utm: {
        source: parsed.data.utmSource,
        medium: parsed.data.utmMedium,
        campaign: parsed.data.utmCampaign,
        content: parsed.data.utmContent,
        term: parsed.data.utmTerm,
      },
    });

    diagnosticId = diagnostic.id;
  } catch (error) {
    console.error(
      "[start-diagnostic-action] Falha ao iniciar diagnóstico:",
      error instanceof Error ? error.message : error,
    );

    const formError =
      error instanceof DatabaseError
        ? "Não conseguimos salvar seus dados agora. Tente novamente em instantes."
        : "Algo deu errado ao iniciar seu diagnóstico. Tente novamente.";

    return { status: "error", formError };
  }

  // redirect() lança um sinal especial do Next.js — precisa ficar fora
  // do try/catch acima, senão o catch o interpretaria como um erro real.
  redirect(`/diagnostico/${diagnosticId}`);
}
