import { Card, CardContent } from "@/components/ui/card";
import { PLAN_MONTHS, type PlanFront } from "@/lib/plan-timeline";

type PlanCronogramaProps = {
  fronts: PlanFront[];
};

const WEEKS = Array.from({ length: 12 }, (_, index) => `S${index + 1}`);

/**
 * Cronograma das frentes — derivado 100% de buildPlanFronts
 * (src/lib/plan-timeline.ts), nunca um dado novo pedido à IA. Uma linha
 * por frente (tipo de ação) que de fato aparece no plano, com uma barra
 * por mês que tem ação naquele mês, distribuída nas 12 colunas de semana
 * (mês 1 = S1-S4, mês 2 = S5-S8, mês 3 = S9-S12) — a granularidade real
 * dos dados continua sendo por MÊS (não existe um cronograma semana a
 * semana por frente gerado pela IA), as 12 colunas são só uma grade visual
 * mais densa, igual ao layout de referência, pra deixar o cronograma do
 * trimestre mais fácil de escanear. A cor da barra é a cor da FASE
 * (navy/azul/laranja, legenda no topo), não a cor da frente, pra deixar
 * claro em que etapa do trimestre cada frente concentra esforço.
 */
export function PlanCronograma({ fronts }: PlanCronogramaProps) {
  if (fronts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card rounded-xl py-0">
      <CardContent className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-brand-navy-900 text-lg font-extrabold">Cronograma das frentes</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              12 semanas, {fronts.length} {fronts.length === 1 ? "frente" : "frentes"} trabalhando em
              paralelo.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-[13px] text-[#3A465C]">
            {PLAN_MONTHS.map((month) => (
              <span key={month.key} className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: month.color }}
                  aria-hidden="true"
                />
                {month.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-[160px_minmax(0,1fr)] gap-x-3">
            <span />
            <div className="grid grid-cols-12 border-b border-[#E6EAF1] pb-2 text-center text-xs font-semibold text-[#56627A]">
              {WEEKS.map((week) => (
                <span key={week}>{week}</span>
              ))}
            </div>
          </div>

          {fronts.map((front) => (
            <div
              key={front.actionType}
              className="grid min-w-[760px] grid-cols-[160px_minmax(0,1fr)] items-center gap-x-3"
            >
              <span className="text-brand-navy-900 truncate text-sm font-semibold">{front.label}</span>
              <div className="bg-muted grid h-8 grid-cols-12 gap-1 rounded-lg p-0.5">
                {front.cells.map((cell, index) => {
                  const month = PLAN_MONTHS[index];
                  const count = cell.actions.length;
                  if (count === 0) {
                    return <span key={month.key} style={{ gridColumn: `${index * 4 + 1} / span 4` }} />;
                  }
                  return (
                    <div
                      key={month.key}
                      style={{ gridColumn: `${index * 4 + 1} / span 4`, backgroundColor: month.color }}
                      className="flex items-center justify-center overflow-hidden rounded-md px-2 text-[11px] font-bold text-white"
                    >
                      {count} {count === 1 ? "ação" : "ações"}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
