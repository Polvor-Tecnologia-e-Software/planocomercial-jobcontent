"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Etapas exibidas enquanto a IA escreve o plano (pedido explícito: trocar
 * o botão parado por uma espera com etapas). `startsAt` em segundos,
 * calibrado pelo tempo real medido das gerações (~70-90s no total). É uma
 * indicação do ritmo médio, não progresso real reportado pela IA — por
 * isso a última etapa nunca se conclui sozinha: fica "em andamento" até o
 * plano de fato ficar pronto (a página então troca para o resultado).
 */
export const PLAN_GENERATION_STEPS = [
  { label: "Analisando o seu funil comercial", startsAt: 0 },
  { label: "Identificando a causa-raiz e as prioridades", startsAt: 8 },
  { label: "Montando a estratégia dos 90 dias", startsAt: 20 },
  { label: "Escrevendo os conteúdos do Mês 1", startsAt: 34 },
  { label: "Escrevendo os conteúdos do Mês 2", startsAt: 50 },
  { label: "Escrevendo os conteúdos do Mês 3", startsAt: 66 },
  { label: "Finalizando o seu plano", startsAt: 82 },
] as const;

/** Índice da etapa em andamento para os segundos decorridos. */
export function currentStepIndex(elapsedSeconds: number): number {
  let index = 0;
  PLAN_GENERATION_STEPS.forEach((step, i) => {
    if (elapsedSeconds >= step.startsAt) index = i;
  });
  return index;
}

/** Barra que avança rápido no início e desacelera perto do fim — nunca chega a 100% sozinha. */
export function progressPercent(elapsedSeconds: number): number {
  return Math.min(95, Math.round(95 * (1 - Math.exp(-elapsedSeconds / 45))));
}

export function PlanGenerationProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 1000);
    return () => window.clearInterval(id);
  }, []);

  const current = currentStepIndex(elapsed);
  const percent = progressPercent(elapsed);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-gradient-brand-blue h-2 rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da geração do plano"
          />
        </div>
        <p className="text-muted-foreground text-center text-xs">
          Isso pode levar de 1 a 2 minutos — não feche esta página.
        </p>
      </div>

      <ol className="flex flex-col gap-2.5" aria-live="polite">
        {PLAN_GENERATION_STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] transition-colors duration-500",
                active && "bg-brand-blue/10 text-brand-navy-900 font-bold",
                done && "text-brand-navy-900",
                !done && !active && "text-muted-foreground/70",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  done && "bg-whatsapp-green text-white",
                  active && "bg-brand-blue text-white",
                  !done && !active && "border-muted-foreground/30 border-2",
                )}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : active ? (
                  <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden="true" />
                ) : null}
              </span>
              {step.label}
              {active ? "…" : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
