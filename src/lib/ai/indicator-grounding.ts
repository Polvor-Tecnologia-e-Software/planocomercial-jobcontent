import type { AIContextFunnel } from "@/lib/ai/commercial-plan-prompt";
import type { CommercialPlan, Indicator } from "@/schemas/commercial-plan";

type FunnelStageKey = keyof AIContextFunnel["requiredFunnel"];

/**
 * Palavras que identificam, pelo NOME do indicador escrito pela IA, a
 * qual dos 5 estágios do funil ele se refere. Deliberadamente restritivo
 * (ex.: "cliente" só conta combinado com "fechad"/"novo") para não
 * confundir um indicador sem relação nenhuma com o funil (ex.: "Taxa de
 * satisfação do cliente") com um dos 5 estágios corrigidos aqui.
 */
const STAGE_PATTERNS: { stage: FunnelStageKey; pattern: RegExp }[] = [
  { stage: "leads", pattern: /\blead/i },
  { stage: "opportunities", pattern: /oportunidade/i },
  { stage: "meetings", pattern: /reuni|\bcall\b/i },
  { stage: "proposals", pattern: /proposta|or[çc]amento/i },
  { stage: "customers", pattern: /\bvenda|client.*fechad|novos? client/i },
];

function detectStage(indicatorName: string): FunnelStageKey | null {
  for (const { stage, pattern } of STAGE_PATTERNS) {
    if (pattern.test(indicatorName)) return stage;
  }
  return null;
}

/**
 * Corrige a meta (targetValue) de indicadores que claramente se referem a
 * um dos 5 estágios do funil (leads, oportunidades, reuniões, propostas,
 * vendas/clientes) para o valor REAL já calculado deterministicamente em
 * funnelAnalysis.requiredFunnel — substituindo o que a IA escreveu, nunca
 * confiando nela para este número específico.
 *
 * Por quê: a checagem geral de números não rastreáveis
 * (src/lib/ai/numeric-guard.ts) só confirma que o número citado aparece
 * EM ALGUM LUGAR do contexto — não que é o número certo para aquele
 * indicador. Isso deixou passar, num teste real, "Oportunidades geradas
 * por mês: meta 5" quando o valor real (requiredFunnel.opportunities)
 * era 2 — a IA citou o requiredFunnel de outro estágio (reuniões, que
 * valia 5), um número que também existe no contexto, então passou pela
 * checagem geral sem ser o valor certo. Para estes 5 indicadores
 * específicos, a fonte da verdade sempre foi o motor de cálculo
 * determinístico, nunca a IA — por isso corrigimos aqui em vez de só
 * confiar numa instrução de prompt.
 *
 * Só corrige quando temos o valor real (requiredFunnel[stage] !==
 * undefined) — sem um valor real pra comparar, deixa o que a IA escreveu
 * (a checagem geral de numeric-guard.ts continua sendo a rede de
 * segurança nesse caso).
 */
export function groundFunnelIndicators(
  plan: CommercialPlan,
  requiredFunnel: AIContextFunnel["requiredFunnel"],
): CommercialPlan {
  const indicators: Indicator[] = plan.indicators.map((indicator) => {
    const stage = detectStage(indicator.name);
    if (!stage) return indicator;

    const realTarget = requiredFunnel[stage];
    if (realTarget === undefined) return indicator;

    return { ...indicator, targetValue: String(realTarget) };
  });

  return { ...plan, indicators };
}
