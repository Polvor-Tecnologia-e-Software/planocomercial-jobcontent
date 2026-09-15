import { cn } from "@/lib/utils";
import type { CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

type Plan90DaysSectionProps = {
  plan: CommercialPlan90Days;
};

const PHASES: {
  key: keyof CommercialPlan90Days;
  range: string;
  label: string;
  gradient: string;
}[] = [
  {
    key: "days1to30",
    range: "Dias 1–30",
    label: "Corrigir / Estruturar",
    gradient: "bg-gradient-to-br from-brand-navy-800 to-brand-blue-dark",
  },
  {
    key: "days31to60",
    range: "Dias 31–60",
    label: "Validar / Ativar",
    gradient: "bg-gradient-blue-light",
  },
  {
    key: "days61to90",
    range: "Dias 61–90",
    label: "Escalar / Otimizar",
    gradient: "bg-gradient-brand-orange",
  },
];

/**
 * Seção 5 (BRD): as 3 fases em grid — `grid-cols-1` empilha no mobile,
 * `lg:grid-cols-3` vira colunas lado a lado no desktop. Sem Tabs/JS:
 * puro CSS resolve o requisito de "uma fase abaixo da outra" no celular.
 * Cada fase é um cartão em degradê (identidade visual); quando a fase
 * tem mais de uma ação, elas empilham dentro do mesmo cartão, separadas
 * por uma linha divisória sutil.
 */
export function Plan90DaysSection({ plan }: Plan90DaysSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Plano de 90 dias</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {PHASES.map((phase) => (
          <div
            key={phase.key}
            className={cn("shadow-card flex flex-col gap-4 rounded-lg p-6 text-white", phase.gradient)}
          >
            <div>
              <span className="text-[11px] font-bold tracking-wide text-white/85 uppercase">
                {phase.range}
              </span>
              <p className="text-[15px] font-extrabold">{phase.label}</p>
            </div>
            <div className="flex flex-col gap-4 divide-y divide-white/15">
              {plan[phase.key].map((action, index) => (
                <ActionCard key={`${phase.key}-${index}`} action={action} isFirst={index === 0} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionCard({ action, isFirst }: { action: PlanAction; isFirst: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", !isFirst && "pt-4")}>
      <div>
        <h3 className="text-[15.5px] font-extrabold">{action.title}</h3>
        <p className="mt-1 text-[13px] text-white/90">{action.objective}</p>
      </div>
      <div className="flex justify-between text-[11.5px] text-white/85">
        <span>
          Responsável
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.suggestedOwner}</b>
        </span>
        <span>
          Prazo
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.deadline}</b>
        </span>
        <span>
          Indicador
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.indicator}</b>
        </span>
      </div>
      <div className="rounded-[10px] bg-white/15 px-3 py-2.5 text-xs">
        <b className="mb-1 block text-[11px] tracking-wide text-white/85 uppercase">
          Critério de conclusão
        </b>
        {action.completionCriteria}
      </div>
    </div>
  );
}
