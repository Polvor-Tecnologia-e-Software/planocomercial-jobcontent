import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";
import { computeMediaBudgetSplit } from "@/lib/plan-media-budget";
import type { StrategicSummary } from "@/schemas/commercial-plan";

type PlanStrategicSummaryProps = {
  summary: StrategicSummary;
};

const PRIORITY_LABEL: Record<StrategicSummary["mediaBudgetPriority"][number]["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  teste: "Teste",
};

/** Mesma paleta azul/laranja/navy do resto da tela — um tom por fatia, nunca mais de 5 fatias (limite do schema). */
const SLICE_COLOR = ["#3B82F6", "#93BBFA", "#F26B1D", "#56627A", "#0B1A33"];

/**
 * Resumo do planejamento estratégico (seção nova do plano de 90 dias,
 * pedido explícito a partir do layout de referência): abre o plano com a
 * estratégia antes do cronograma e das ações. A distribuição de verba é
 * SEMPRE calculada aqui a partir da prioridade qualitativa que a IA
 * escolheu (nunca uma porcentagem vinda da IA) — ver
 * src/lib/plan-media-budget.ts e o comentário em
 * src/schemas/commercial-plan.ts (MediaChannelPrioritySchema) sobre por quê.
 */
export function PlanStrategicSummary({ summary }: PlanStrategicSummaryProps) {
  const budget = computeMediaBudgetSplit(summary.mediaBudgetPriority);

  return (
    <div className="bg-gradient-navy shadow-card flex flex-col gap-7 rounded-xl p-6 sm:p-9">
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold tracking-wide text-[#F59A5E] uppercase">
          Resumo do planejamento estratégico
        </span>
        <h3 className="text-xl leading-snug font-extrabold text-white sm:text-2xl">{summary.headline}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryTile label="Posicionamento">{summary.positioning}</SummaryTile>
        <SummaryTile label="Estratégia de canais">{summary.channelStrategy}</SummaryTile>
        <SummaryTile label="Jornada de conteúdo">{summary.contentJourney}</SummaryTile>
        <SummaryTile label="Distribuição de verba de mídia">
          <div className="flex h-3 overflow-hidden rounded-full">
            {budget.map((slice, index) => (
              <div
                key={slice.channel}
                style={{ width: `${slice.percent}%`, backgroundColor: SLICE_COLOR[index % SLICE_COLOR.length] }}
              />
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] text-[#C9D4E8]">
            {budget.map((slice) => (
              <span key={slice.channel} className="flex items-center gap-1">
                <span>
                  {slice.channel} {slice.percent}%
                </span>
                <span className="text-white/50">({PRIORITY_LABEL[slice.priority]})</span>
              </span>
            ))}
          </div>
        </SummaryTile>
        <SummaryTile label="Processo comercial">{summary.commercialProcess}</SummaryTile>
        <SummaryTile label="Premissas">{summary.premises}</SummaryTile>
      </div>

      <div className="flex flex-col items-start gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] leading-relaxed text-[#E3EAF6]">
          Quer validar essa estratégia e ajustar as metas à realidade da sua equipe?
        </p>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="bg-whatsapp-green hover:bg-whatsapp-green-dark w-full shrink-0 rounded-full text-white hover:text-white sm:w-auto"
        >
          <a
            href={buildWhatsAppLink(
              "Olá! Quero validar a estratégia do meu Plano Comercial Inteligente em 90 Dias com um especialista.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            Validar com um especialista
          </a>
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white/[0.06] p-5">
      <span className="text-[11px] font-bold tracking-wide text-[#7FA8EB] uppercase">{label}</span>
      <div className="text-[15px] leading-relaxed text-[#E3EAF6]">{children}</div>
    </div>
  );
}
