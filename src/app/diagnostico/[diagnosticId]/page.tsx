import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdaptiveDiagnosticJourney } from "@/components/diagnostic/adaptive-diagnostic-journey";
import { ChallengeSelection } from "@/components/diagnostic/challenge-selection";
import { SiteAnalysisConfirmation } from "@/components/diagnostic/site-analysis-confirmation";
import { SiteAnalysisFallback } from "@/components/diagnostic/site-analysis-fallback";
import {
  siteAnalysisResultSchema,
  type SiteAnalysisResult,
} from "@/lib/ai/site-analysis-schema";
import { ResultPage } from "@/components/result/result-page";
import { companies, diagnostics, siteAnalyses } from "@/lib/database";
import { analyzeSite } from "@/server/analyze-site";
import { getCommercialPlanResult } from "@/server/get-commercial-plan-result";
import { resumeDiagnosticJourney } from "@/server/resume-diagnostic-journey";

/** UUID gerado sempre pelo servidor (gen_random_uuid()) — nunca aceito de outro formato, para nunca deixar um valor malformado chegar a uma query. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Timeout de todas as Server Actions usadas nesta página (gerar plano via
// IA, gerar PDF) — nesta versão do Next.js, isso se configura aqui, não
// dentro do arquivo de cada Server Action (erro de build real: "Only
// async functions are allowed to be exported in a 'use server' file").
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Preparando seu diagnóstico | Plano Comercial Inteligente em 90 Dias™",
};

type PageProps = {
  params: Promise<{ diagnosticId: string }>;
  searchParams: Promise<{ analysisError?: string; challengeError?: string }>;
};

function PageShell({
  progress,
  size = "default",
  children,
}: {
  progress: number;
  /** "wide" para a tela de resultado (layout tipo dashboard, mais larga que o resto da jornada). */
  size?: "default" | "wide";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader progress={progress} />
      <main className="flex flex-1 flex-col">
        <Container size={size} className="flex flex-1 flex-col">
          {children}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

function parseResultOrNull(value: unknown): SiteAnalysisResult | null {
  const parsed = siteAnalysisResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

type Outcome =
  | { status: "completed"; siteAnalysisId: string; result: SiteAnalysisResult }
  | { status: "failed" | "skipped"; reason: string; invalidWebsite?: boolean };

/**
 * Destino após a primeira captura. Executa a análise automática do site
 * (Tela 2 do BRD) quando ainda não foi feita para este diagnóstico, e
 * mostra a tela correspondente: confirmação (sucesso), ou a opção de
 * continuar sem análise (sem site, ou falha).
 *
 * Uma vez que o diagnóstico avança para "company_confirmed", mostra a
 * Tela 4 (escolha do desafio prioritário); depois disso, a jornada
 * adaptativa de perguntas (Telas 5+, ver AdaptiveDiagnosticJourney).
 * Qualquer status a partir de "prediagnosis_ready" (perguntas concluídas)
 * cai na tela de resultado (ResultPage), que decide sozinha — a partir do
 * banco, nunca chamando IA na renderização — se mostra o plano pronto,
 * um convite para gerá-lo, um estado de espera, ou uma falha recuperável.
 */
export default async function DiagnosticStatusPage({ params, searchParams }: PageProps) {
  const { diagnosticId } = await params;
  const { analysisError, challengeError } = await searchParams;

  if (!UUID_PATTERN.test(diagnosticId)) {
    notFound();
  }

  const diagnostic = await diagnostics.getDiagnosticById(diagnosticId);
  if (!diagnostic) {
    notFound();
  }

  if (diagnostic.status === "company_confirmed") {
    return (
      <PageShell progress={40}>
        {challengeError ? (
          <p role="alert" className="text-destructive mb-4 text-center text-sm">
            Não conseguimos salvar sua última ação. Tente novamente.
          </p>
        ) : null}
        <ChallengeSelection diagnosticId={diagnosticId} />
      </PageShell>
    );
  }

  if (diagnostic.status === "challenge_selected" || diagnostic.status === "adaptive_in_progress") {
    const journeyState = await resumeDiagnosticJourney(diagnosticId);

    if (journeyState && !journeyState.isComplete && journeyState.diagnostic.selected_challenge) {
      // 45-70: faixa reservada para o progresso das perguntas adaptativas,
      // interpolada a partir do progresso real desta etapa (ver
      // adaptive-engine.computeProgress) — a barra do cabeçalho é uma
      // fotografia do carregamento da página, não atualiza sozinha
      // durante a jornada (isso é papel da barra própria dentro dela).
      const headerProgress = 45 + Math.round((journeyState.progress.percent / 100) * 25);

      return (
        <PageShell progress={headerProgress}>
          <AdaptiveDiagnosticJourney
            diagnosticId={diagnosticId}
            challenge={journeyState.diagnostic.selected_challenge}
            initialAnswers={journeyState.answers}
          />
        </PageShell>
      );
    }
    // Sem desafio selecionado (não deveria acontecer aqui) ou jornada já
    // completa e auto-curada para "prediagnosis_ready" — cai para o
    // fallback genérico abaixo, igual a qualquer outro status ainda sem
    // tela própria.
  }

  if (diagnostic.status !== "started" && diagnostic.status !== "company_analyzing") {
    // Cobre prediagnosis_ready, lead_captured, generating, completed,
    // failed (e o hipotético goal_defined, hoje nunca atribuído por
    // nenhum código) — getCommercialPlanResult decide, a partir do banco,
    // qual desses estados mostrar. Nunca chama IA para renderizar.
    const resultState = await getCommercialPlanResult(diagnosticId);
    return (
      <PageShell progress={90} size="wide">
        <ResultPage state={resultState} />
      </PageShell>
    );
  }

  const company = await companies.getCompanyById(diagnostic.company_id);
  if (!company) {
    notFound();
  }

  const existingAnalysis =
    await siteAnalyses.getLatestAnalysisForDiagnostic(diagnosticId);

  let outcome: Outcome;

  if (existingAnalysis) {
    // Já existe uma análise para este diagnóstico (ex.: a pessoa deu
    // refresh na página) — reaproveita em vez de rodar tudo de novo, o
    // que evitaria uma nova chamada de IA desnecessária.
    if (existingAnalysis.status === "completed") {
      const parsed = parseResultOrNull(existingAnalysis.result_json);
      outcome = parsed
        ? { status: "completed", siteAnalysisId: existingAnalysis.id, result: parsed }
        : { status: "failed", reason: "O registro salvo da análise ficou inválido." };
    } else {
      outcome = {
        status: "failed",
        reason: "Não foi possível concluir a análise do site.",
      };
    }
  } else {
    const result = await analyzeSite({ diagnosticId, website: company.website });

    if (result.status === "completed") {
      outcome = {
        status: "completed",
        siteAnalysisId: result.siteAnalysisId,
        result: result.result,
      };
    } else if (result.status === "skipped") {
      outcome = { status: "skipped", reason: "no_website" };
    } else {
      outcome = { status: "failed", reason: result.reason, invalidWebsite: result.invalidWebsite };
    }
  }

  return (
    <PageShell progress={25}>
      {analysisError ? (
        <p role="alert" className="text-destructive mb-4 text-center text-sm">
          Não conseguimos salvar sua última ação. Tente novamente.
        </p>
      ) : null}

      {outcome.status === "completed" ? (
        <SiteAnalysisConfirmation
          diagnosticId={diagnosticId}
          companyId={company.id}
          siteAnalysisId={outcome.siteAnalysisId}
          result={outcome.result}
        />
      ) : (
        <SiteAnalysisFallback
          diagnosticId={diagnosticId}
          reason={
            outcome.status === "skipped"
              ? "no_website"
              : outcome.invalidWebsite
                ? "invalid_website"
                : "failed"
          }
        />
      )}
    </PageShell>
  );
}
