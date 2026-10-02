import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { Priority } from "@/schemas/commercial-plan";

type PrioritiesSectionProps = {
  priorities: Priority[];
};

/** 01 e 02 em azul, 03 em laranja — mesmas 2 cores de marca usadas no resto da tela, sem degradê (pedido explícito, layout de referência). */
const NUMBER_COLOR = ["text-brand-blue", "text-brand-blue", "text-brand-orange-deep"];

/**
 * Seção 4 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito): cabeçalho com selo numerado + título, e cartões
 * simplificados — número, título, racional e uma linha de
 * indicador/prazo, sem os campos "Problema resolvido"/"Impacto
 * esperado" do layout anterior (o schema continua gerando os dois, só a
 * tela não os mostra mais aqui — ver Priority em commercial-plan.ts).
 * Sempre exatamente 3 prioridades (garantido pelo schema da Etapa 3).
 */
export function PrioritiesSection({ priorities }: PrioritiesSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-brand-blue text-[11px] font-bold tracking-wide uppercase">03 · Prioridades</span>
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">
          As três decisões que mais movem o resultado
        </h2>
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
                  "text-4xl leading-none font-extrabold tabular-nums",
                  NUMBER_COLOR[index % NUMBER_COLOR.length],
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-brand-navy-900 text-lg font-extrabold">{priority.title}</h3>
              <p className="text-sm text-[#45505f]">{priority.rationale}</p>

              <p className="border-t border-[#E6EAF1] pt-3 text-[12.5px] text-muted-foreground">
                Indicador: <span className="text-brand-navy-900 font-semibold">{priority.primaryIndicator}</span>{" "}
                · Prazo: <span className="text-brand-navy-900 font-semibold">{priority.timeframe}</span>
              </p>

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
