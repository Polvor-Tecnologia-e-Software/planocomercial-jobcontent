import { notFound } from "next/navigation";

import { CtaSection } from "@/components/result/cta-section";
import { FunnelLeakMap } from "@/components/result/funnel-leak-map";
import { HeroSection } from "@/components/result/hero-section";
import { InboundMarketingSection } from "@/components/result/inbound-marketing-section";
import { IndicatorsSection } from "@/components/result/indicators-section";
import { LimitationsSection } from "@/components/result/limitations-section";
import { Plan90DaysSection } from "@/components/result/plan-90-days-section";
import { FailedState, GeneratingState, NotGeneratedState } from "@/components/result/plan-status-states";
import { PrioritiesSection } from "@/components/result/priorities-section";
import { RootCauseChain } from "@/components/result/root-cause-chain";
import { SeoOpportunitiesSection } from "@/components/result/seo-opportunities-section";
import { WeeklyAgendaSection } from "@/components/result/weekly-agenda-section";
import type { CommercialPlanResultState } from "@/server/get-commercial-plan-result";

type ResultPageProps = {
  state: CommercialPlanResultState;
};

/**
 * Orquestra a tela de resultado inteira a partir do estado já carregado
 * (ver src/server/get-commercial-plan-result.ts) — este componente não
 * busca dado nenhum sozinho e não chama IA; só decide o que desenhar.
 * Quase tudo aqui é Server Component: o único client component é o botão
 * de gerar/tentar de novo (src/components/result/generate-plan-trigger.tsx).
 */
export function ResultPage({ state }: ResultPageProps) {
  if (state.status === "not_found") {
    notFound();
  }

  if (state.status === "not_generated") {
    return <NotGeneratedState diagnosticId={state.diagnosticId} companyName={state.companyName} />;
  }

  if (state.status === "generating") {
    return <GeneratingState companyName={state.companyName} />;
  }

  if (state.status === "failed") {
    return (
      <FailedState diagnosticId={state.diagnosticId} companyName={state.companyName} canRetry={state.canRetry} />
    );
  }

  const { plan } = state;

  return (
    <div className="flex flex-1 flex-col gap-10 py-8 sm:gap-14 sm:py-12">
      <HeroSection
        companyName={state.companyName}
        generatedAt={state.generatedAt}
        executiveDiagnosis={plan.executiveDiagnosis}
        primaryBottleneck={state.primaryBottleneck}
        dataQualityPercentage={state.dataQualityPercentage}
        confidence={state.confidence}
      />
      <FunnelLeakMap stages={state.funnelStages} />
      <RootCauseChain description={plan.rootCause.description} evidence={plan.rootCause.evidence} />
      <PrioritiesSection priorities={plan.priorities} />
      <Plan90DaysSection plan={plan.plan90Days} />
      <InboundMarketingSection
        primaryBottleneck={state.primaryBottleneck}
        secondaryRisk={state.secondaryRisk}
      />
      <WeeklyAgendaSection agenda={plan.weeklyManagerAgenda} />
      <IndicatorsSection indicators={plan.indicators} />
      <SeoOpportunitiesSection opportunities={state.seoOpportunities} />
      <LimitationsSection limitations={plan.limitations} />
      <CtaSection diagnosticId={state.diagnosticId} />
    </div>
  );
}
