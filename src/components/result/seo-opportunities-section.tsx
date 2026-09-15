import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Competition } from "@/lib/seo/keyword-opportunity";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import { cn } from "@/lib/utils";

type SeoOpportunitiesSectionProps = {
  opportunities: KeywordOpportunity[];
};

const COMPETITION_LABEL: Record<Competition, string> = {
  low: "Concorrência baixa",
  medium: "Concorrência média",
  high: "Concorrência alta",
  unknown: "Concorrência não informada",
};

const COMPETITION_BADGE_VARIANT: Record<Competition, "default" | "secondary" | "muted"> = {
  low: "default",
  medium: "secondary",
  high: "muted",
  unknown: "muted",
};

/**
 * Oportunidades de SEO — a IA sugere palavras-chave relacionadas às
 * informadas na captura, com uma ESTIMATIVA de volume de busca e
 * concorrência (nunca dado real do Google — deixado explícito no texto e
 * em cada cartão, ver src/lib/ai/seo-keywords-prompt.ts). Só aparece
 * quando existe pelo menos uma sugestão (nunca um placeholder vazio):
 * sem palavras-chave informadas, ou se a chamada de IA falhar, esta
 * seção simplesmente não é renderizada — ver
 * src/server/analyze-seo-opportunities.ts.
 *
 * A ordenação (src/lib/seo/keyword-opportunity.ts) e o selo "não
 * explorada" (src/lib/seo/keyword-coverage.ts, comparação de texto
 * determinística contra o perfil confirmado da empresa) continuam
 * aplicados de forma determinística sobre as estimativas da IA.
 */
export function SeoOpportunitiesSection({ opportunities }: SeoOpportunitiesSectionProps) {
  if (opportunities.length === 0) return null;

  const gapCount = opportunities.filter((opportunity) => opportunity.coverageGap).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold sm:text-2xl">Oportunidades para a sua empresa</h2>
        <p className="text-muted-foreground text-sm">
          Palavras-chave sugeridas pela IA, com estimativa de volume de busca e
          concorrência — não são números reais do Google, servem como direção, não como dado
          exato.
          {gapCount > 0
            ? ` ${gapCount} ${gapCount === 1 ? "delas ainda não aparece" : "delas ainda não aparecem"} no perfil da sua empresa — oportunidades de nicho a explorar.`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <Card
            key={opportunity.keyword}
            className={cn(
              opportunity.coverageGap && "border-brand-orange-deep/40 ring-brand-orange-deep/10 ring-1",
            )}
          >
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  #{opportunity.opportunityRank}
                </span>
                <Badge variant={COMPETITION_BADGE_VARIANT[opportunity.competition]}>
                  {COMPETITION_LABEL[opportunity.competition]}
                </Badge>
              </div>
              <p className="text-sm font-semibold">{opportunity.keyword}</p>
              <p className="text-muted-foreground text-xs">
                {opportunity.avgMonthlySearches !== null
                  ? `~${opportunity.avgMonthlySearches.toLocaleString("pt-BR")} buscas/mês (estimativa da IA)`
                  : "Volume de busca não disponível"}
              </p>
              {opportunity.coverageGap ? (
                <Badge variant="accent" className="w-fit">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Oportunidade de nicho não explorada
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
