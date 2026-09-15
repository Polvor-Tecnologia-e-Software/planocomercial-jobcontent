"use client";

import { Suspense, useState } from "react";

import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CaptureForm } from "@/components/diagnostic/capture-form";
import { PromiseScreen } from "@/components/diagnostic/promise-screen";

type JourneyStep = "promise" | "capture";

// Progresso exibido na barra do cabeçalho (seção 3.1 do BRD: barra por
// macroetapa, sem expor contagem rígida de perguntas). Os próximos
// valores (confirmação, desafio, meta...) serão adicionados junto com
// cada nova tela da jornada.
const PROGRESS_BY_STEP: Record<JourneyStep, number> = {
  promise: 5,
  capture: 15,
};

/**
 * Orquestra a parte da jornada implementada até agora: Tela 1 (Promessa)
 * e a primeira captura (empresa, site, e-mail). Ao concluir a captura, a
 * Server Action redireciona para /diagnostico/[id] — a próxima etapa
 * (análise automática do site) ainda não implementada.
 */
export function DiagnosticJourney() {
  const [step, setStep] = useState<JourneyStep>("promise");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Sem cabeçalho na tela inicial de propósito — ela já tem sua
          própria logo grande no hero (ver promise/hero-section.tsx); um
          segundo cabeçalho com logo no topo seria redundante. Volta a
          aparecer a partir da captura, igual ao resto da jornada. */}
      {step !== "promise" ? <SiteHeader progress={PROGRESS_BY_STEP[step]} /> : null}
      <main className="flex flex-1 flex-col">
        {step === "promise" ? (
          // Sem Container aqui de propósito: as seções do layout aprovado
          // (src/components/diagnostic/promise/*) são full-bleed (fundo
          // até a borda da tela), cada uma com seu próprio envelope de
          // largura máxima interno — um Container ancestral limitaria o
          // fundo colorido a max-w-6xl, cortando o efeito.
          <PromiseScreen onStart={() => setStep("capture")} />
        ) : (
          <Container className="flex flex-1 flex-col">
            {/* useSearchParams() (usado dentro de CaptureForm para ler os
                UTMs) exige um Suspense boundary ao redor de quem o chama. */}
            <Suspense fallback={null}>
              <CaptureForm />
            </Suspense>
          </Container>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
