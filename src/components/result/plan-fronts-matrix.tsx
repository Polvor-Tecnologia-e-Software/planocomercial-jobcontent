"use client";

import { PLAN_MONTHS, type PlanFront } from "@/lib/plan-timeline";
import { cn } from "@/lib/utils";

type PlanFrontsMatrixProps = {
  fronts: PlanFront[];
  selected: number;
  onSelect: (index: number) => void;
};

/**
 * Matriz "frente x mês" sempre visível com os 3 meses lado a lado — pedido
 * explícito a partir do layout de referência. Os itens de cada célula e o
 * selo "Entrega" vêm 100% de `details`/`completionCriteria`, que a IA já
 * gera por ação (ver src/lib/plan-timeline.ts) — nenhum dado novo pedido a
 * ela, só reorganiza o que já existe numa visão de mês a mês. O cabeçalho
 * de cada mês é clicável e compartilha o MESMO estado `selected` das abas
 * em plan-month-detail.tsx, igual ao layout de referência (clicar na
 * matriz ou nas abas faz a mesma coisa).
 */
export function PlanFrontsMatrix({ fronts, selected, onSelect }: PlanFrontsMatrixProps) {
  if (fronts.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E6EAF1] bg-white">
      <div className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))]">
        <div className="flex items-end bg-[#F6F8FB] px-4 py-3 text-[11px] font-bold tracking-wide text-[#56627A] uppercase">
          Frente
        </div>
        {PLAN_MONTHS.map((month, index) => {
          const active = index === selected;
          return (
            <button
              key={month.key}
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={active}
              aria-label={`Selecionar ${month.tab} na matriz`}
              className="flex min-h-16 flex-col justify-center border-b-4 px-4 py-3 text-left transition-colors"
              style={{
                backgroundColor: active ? month.color : "#F6F8FB",
                borderBottomColor: month.color,
                color: active ? "#FFFFFF" : "#0B1A33",
              }}
            >
              <span className="text-[11px] font-bold tracking-wide uppercase opacity-85">
                {month.tab} · {month.days}
              </span>
              <span className="text-[15px] font-extrabold">{month.name}</span>
            </button>
          );
        })}
      </div>

      {fronts.map((front) => (
        <div
          key={front.actionType}
          className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] border-t border-[#E6EAF1]"
        >
          <div className="flex flex-col justify-center bg-[#FBFCFD] px-4 py-3.5">
            <span
              className="w-fit rounded-md px-2 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${front.color}1A`, color: front.color }}
            >
              {front.label}
            </span>
          </div>
          {front.cells.map((cell, index) => {
            const active = index === selected;
            const month = PLAN_MONTHS[index];
            const items = cell.actions.flatMap((action) => action.details).slice(0, 2);
            const entrega = cell.actions[0]?.completionCriteria;
            return (
              <div
                key={month.key}
                className={cn(
                  "flex flex-col gap-2 border-l border-[#E6EAF1] px-4 py-3.5",
                  active ? "bg-[#EEF4FD]" : "bg-white",
                )}
              >
                {items.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2 text-[13px] leading-snug text-[#3A465C]">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: active ? month.color : "#B7C1D3" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {entrega ? (
                  <span
                    className="w-fit rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      backgroundColor: active ? month.color : "#EDEFF3",
                      color: active ? "#FFFFFF" : "#3A465C",
                    }}
                  >
                    Entrega: {entrega}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
