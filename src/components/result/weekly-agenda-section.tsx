import type { WeeklyAgendaItem } from "@/schemas/commercial-plan";

type WeeklyAgendaSectionProps = {
  agenda: WeeklyAgendaItem[];
};

const DAY_LABELS = ["Segunda", "Quarta", "Sexta"] as const;

/**
 * Seção 7 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito): lista única empilhada com divisórias, em vez dos 3
 * cartões lado a lado do layout anterior — aqui fica ao lado de
 * IndicatorsSection numa grade de 2 colunas (ver result-page.tsx).
 * A agenda da IA (Etapa 3) é uma lista representativa de foco semanal
 * (não um calendário completo, de propósito) — mapeamos os até 3
 * primeiros itens para os 3 dias; se vier menos, mostramos só o que
 * existe, nunca inventamos um item extra para completar a lista.
 */
export function WeeklyAgendaSection({ agenda }: WeeklyAgendaSectionProps) {
  const items = agenda.slice(0, DAY_LABELS.length);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-brand-navy-900 text-2xl font-extrabold">Agenda semanal do gestor</h2>

      <div className="shadow-card flex flex-col divide-y divide-[#E6EAF1] rounded-xl bg-white">
        {items.map((item, index) => (
          <div
            key={`${DAY_LABELS[index]}-${item.focus}`}
            className="flex flex-col gap-1 p-5 sm:flex-row sm:gap-5"
          >
            <span className="text-brand-blue w-20 shrink-0 text-[11px] font-bold tracking-wide uppercase">
              {DAY_LABELS[index]}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-brand-navy-900 text-[15px] font-extrabold">{item.focus}</p>
              <p className="text-[13px] leading-relaxed text-[#45505f]">{item.activities.join(", ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
