import { PlanCronograma } from "@/components/result/plan-cronograma";
import { PlanMonthDetail } from "@/components/result/plan-month-detail";
import { PlanStrategicSummary } from "@/components/result/plan-strategic-summary";
import { buildPlanFronts } from "@/lib/plan-timeline";
import type { CommercialPlan90Days, PlanPhaseSummaries, StrategicSummary } from "@/schemas/commercial-plan";

type Plan90DaysSectionProps = {
  plan: CommercialPlan90Days;
  strategicSummary: StrategicSummary;
  phaseSummaries: PlanPhaseSummaries;
  companyName: string;
  companyWebsite: string | null;
};

/**
 * Seção 5 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito do usuário): resumo estratégico, cronograma das
 * frentes (visão geral dos 3 meses, derivada deterministicamente de
 * plan90Days — ver src/lib/plan-timeline.ts, nunca um dado novo pedido à
 * IA) e, por fim, o detalhamento mês a mês com abas
 * (src/components/result/plan-month-detail.tsx — único client component
 * desta seção). É a MESMA estrutura pra qualquer objetivo selecionado —
 * nunca varia por desafio.
 */
export function Plan90DaysSection({
  plan,
  strategicSummary,
  phaseSummaries,
  companyName,
  companyWebsite,
}: Plan90DaysSectionProps) {
  const fronts = buildPlanFronts(plan);

  return (
    <section id="plano" className="flex scroll-mt-20 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Plano de 90 dias</h2>
      </div>

      <PlanStrategicSummary summary={strategicSummary} />

      <PlanCronograma fronts={fronts} />

      <PlanMonthDetail
        plan={plan}
        phaseSummaries={phaseSummaries}
        companyName={companyName}
        companyWebsite={companyWebsite}
      />
    </section>
  );
}
