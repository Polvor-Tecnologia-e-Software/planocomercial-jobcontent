import { Card, CardContent } from "@/components/ui/card";
import type { Indicator } from "@/schemas/commercial-plan";

type IndicatorsSectionProps = {
  indicators: Indicator[];
};

const FREQUENCY_LABEL: Record<Indicator["frequency"], string> = {
  daily: "Diário",
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

/**
 * Seção 8 (BRD). O pedido original também queria "como medir",
 * "responsável" e "sinal de alerta" por indicador — campos que o schema
 * da Etapa 3 (IndicatorSchema) não tem hoje. Mostramos só o que existe
 * (nome, valor atual, meta, frequência) em vez de inventar os demais.
 */
export function IndicatorsSection({ indicators }: IndicatorsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Indicadores para acompanhar</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((indicator, index) => (
          <Card key={`${index}-${indicator.name}`} className="shadow-card py-0">
            <CardContent className="flex flex-col gap-3 p-5">
              <p className="text-brand-navy-900 text-sm font-bold">{indicator.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-brand-orange-deep text-3xl font-extrabold">
                  {indicator.currentValue ?? "—"}
                </span>
                {indicator.targetValue ? (
                  <span className="text-muted-foreground text-sm font-semibold">
                    → meta: {indicator.targetValue}
                  </span>
                ) : null}
              </div>
              <span className="text-muted-foreground text-xs">{FREQUENCY_LABEL[indicator.frequency]}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
