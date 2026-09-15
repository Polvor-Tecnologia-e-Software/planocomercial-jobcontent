import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/schemas/commercial-plan";

type RootCauseChainProps = {
  description: string;
  evidence: Evidence[];
};

const SOURCE_LABEL: Record<Evidence["source"], string> = {
  deterministic_calculation: "Cálculo",
  confirmed_data: "Dado confirmado",
  declared_answer: "Resposta declarada",
  site_fact: "Fato do site",
  inference: "Inferência",
};

/**
 * Seção 3 (BRD): a causa-raiz descrita pela IA, mais a cadeia de
 * evidências que sustenta essa conclusão — cada uma com sua proveniência
 * (hierarquia de confiança da Etapa 3), para nunca apresentar uma
 * inferência como se fosse um fato confirmado.
 */
export function RootCauseChain({ description, evidence }: RootCauseChainProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Causa-raiz</h2>
      </div>

      <div className="bg-gradient-navy shadow-lift rounded-lg px-7 py-6">
        <p className="max-w-3xl text-base leading-relaxed font-semibold text-white sm:text-lg">
          {description}
        </p>
      </div>

      {evidence.length > 0 ? (
        <div className="flex flex-col items-stretch gap-0">
          {evidence.map((item, index) => {
            const isOrange = index % 2 === 1;
            return (
              <div key={`${item.summary}-${index}`} className="flex flex-col items-center">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-brand-blue py-1 text-base font-bold">
                    ↓
                  </span>
                ) : null}
                <Card
                  className={cn(
                    "shadow-card w-full border-l-4 py-0",
                    isOrange ? "border-l-brand-orange" : "border-l-brand-blue",
                  )}
                >
                  <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-brand-navy-900 text-sm">{item.summary}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap sm:ml-3",
                        isOrange ? "bg-[#fff1e6] text-brand-orange-deep" : "bg-[#eaf5ff] text-brand-blue-dark",
                      )}
                    >
                      {SOURCE_LABEL[item.source]}
                    </span>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
