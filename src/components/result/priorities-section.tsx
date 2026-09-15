import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Priority } from "@/schemas/commercial-plan";

type PrioritiesSectionProps = {
  priorities: Priority[];
};

const NUMBER_GRADIENT = [
  "bg-gradient-brand-blue",
  "bg-gradient-brand-orange",
  "bg-gradient-to-br from-brand-orange to-brand-orange-deep",
];

/** Seção 4 (BRD): as 3 prioridades, sempre exatamente 3 (garantido pelo schema da Etapa 3). */
export function PrioritiesSection({ priorities }: PrioritiesSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Três prioridades</h2>
        <p className="text-muted-foreground text-sm">
          O que mais move o resultado nos próximos 90 dias.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {priorities.map((priority, index) => (
          <Card
            key={`${index}-${priority.title}`}
            className="shadow-card hover:shadow-lift group rounded-lg py-0 transition-all duration-200 hover:-translate-y-1"
          >
            <CardContent className="flex flex-col gap-3 p-6">
              <span
                className={cn(
                  "bg-clip-text text-4xl leading-none font-extrabold text-transparent tabular-nums",
                  NUMBER_GRADIENT[index % NUMBER_GRADIENT.length],
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-brand-navy-900 text-lg font-extrabold">{priority.title}</h3>
              <p className="text-sm text-[#45505f]">{priority.rationale}</p>

              <dl className="mt-1 flex flex-col gap-2.5 text-[12.5px]">
                <div>
                  <dt className="text-muted-foreground">Problema resolvido</dt>
                  <dd className="text-brand-navy-900 font-medium">{priority.problemSolved}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Impacto esperado</dt>
                  <dd className="text-brand-navy-900 font-medium">{priority.expectedImpact}</dd>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  <div>
                    <dt className="text-muted-foreground">Indicador</dt>
                    <dd className="text-brand-navy-900 font-medium">{priority.primaryIndicator}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prazo</dt>
                    <dd className="text-brand-navy-900 font-medium">{priority.timeframe}</dd>
                  </div>
                </div>
              </dl>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="bg-whatsapp-green hover:bg-whatsapp-green-dark shadow-whatsapp-green/25 hover:shadow-whatsapp-green/30 mt-1 w-full rounded-full text-white shadow-lg hover:text-white"
              >
                <a
                  href={buildWhatsAppLink(
                    `Olá! Vi no meu Plano Comercial que uma das prioridades é "${priority.title}". Quero entender melhor como avançar nisso.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-5" />
                  Falar com um especialista
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
