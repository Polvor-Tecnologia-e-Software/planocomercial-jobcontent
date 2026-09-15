import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeeklyAgendaItem } from "@/schemas/commercial-plan";

type WeeklyAgendaSectionProps = {
  agenda: WeeklyAgendaItem[];
};

const DAY_LABELS = ["Segunda", "Quarta", "Sexta"] as const;

const BORDER_CLASS = ["border-t-brand-blue", "border-t-brand-orange", "border-t-brand-navy-800"];

/**
 * Seção 7 (BRD): 3 colunas (Segunda/Quarta/Sexta) no desktop, empilhadas
 * no mobile. A agenda da IA (Etapa 3) é uma lista representativa de foco
 * semanal (não um calendário completo, de propósito) — mapeamos os até 3
 * primeiros itens para os 3 dias; se vier menos, mostramos só o que
 * existe, nunca inventamos um item extra para completar a grade.
 */
export function WeeklyAgendaSection({ agenda }: WeeklyAgendaSectionProps) {
  const items = agenda.slice(0, DAY_LABELS.length);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Agenda semanal do gestor</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={`${DAY_LABELS[index]}-${item.focus}`}
            className={cn("shadow-card border-t-4 py-0", BORDER_CLASS[index])}
          >
            <CardContent className="flex flex-col gap-2.5 p-5">
              <span className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
                {DAY_LABELS[index]}
              </span>
              <p className="text-brand-navy-900 text-[15px] font-extrabold">{item.focus}</p>
              <ul className="flex flex-col gap-1.5 text-[13px] text-[#45505f]">
                {item.activities.map((activity) => (
                  <li key={activity}>• {activity}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
