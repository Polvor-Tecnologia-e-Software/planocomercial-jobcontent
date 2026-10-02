import { Card, CardContent } from "@/components/ui/card";
import type { Indicator } from "@/schemas/commercial-plan";

type IndicatorsSectionProps = {
  indicators: Indicator[];
};

/**
 * Seção 8 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito): cartões compactos em grade 2x2, valor atual em
 * destaque + seta azul para a meta na mesma linha — aqui fica ao lado de
 * WeeklyAgendaSection numa grade de 2 colunas (ver result-page.tsx). A
 * frequência (antes mostrada como rótulo à parte) não aparece mais
 * isolada — o layout de referência não a exibe, e o nome do indicador já
 * costuma trazer a cadência (ex.: "Leads novos/mês"); o campo
 * `frequency` continua no schema e no PDF, só esta tela simplificou.
 * O pedido original também queria "como medir", "responsável" e "sinal
 * de alerta" por indicador — campos que o schema da Etapa 3
 * (IndicatorSchema) não tem hoje. Mostramos só o que existe (nome, valor
 * atual, meta) em vez de inventar os demais.
 */
export function IndicatorsSection({ indicators }: IndicatorsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-brand-navy-900 text-2xl font-extrabold">Indicadores para acompanhar</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {indicators.map((indicator, index) => (
          <Card key={`${index}-${indicator.name}`} className="shadow-card py-0">
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-muted-foreground text-[13px]">{indicator.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-brand-navy-900 text-[26px] font-extrabold">
                  {indicator.currentValue ?? "—"}
                </span>
                {indicator.targetValue ? (
                  <span className="text-brand-blue text-base font-bold">→ {indicator.targetValue}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
