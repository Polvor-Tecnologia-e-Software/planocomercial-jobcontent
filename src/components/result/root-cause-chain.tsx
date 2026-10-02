import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";
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

/** Cor do selo por proveniência (hierarquia de confiança da Etapa 3), não mais alternada por índice — dado confirmado/declarado/fato do site são a mesma confiança (azul), cálculo é neutro (cinza) e inferência é a de menor confiança (laranja). */
const SOURCE_BADGE_CLASS: Record<Evidence["source"], string> = {
  confirmed_data: "bg-[#eaf5ff] text-brand-blue-dark",
  declared_answer: "bg-[#eaf5ff] text-brand-blue-dark",
  site_fact: "bg-[#eaf5ff] text-brand-blue-dark",
  deterministic_calculation: "bg-[#eef1f5] text-[#5b6572]",
  inference: "bg-[#fff1e6] text-brand-orange-deep",
};

/**
 * Seção 3 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito): cartão escuro com a causa-raiz à esquerda e a
 * cadeia de evidências (cada uma com sua proveniência) à direita, lado a
 * lado. CTA de WhatsApp próprio abaixo, específico deste diagnóstico
 * (diferente do CTA genérico de fechamento em cta-section.tsx).
 */
export function RootCauseChain({ description, evidence }: RootCauseChainProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
        <div className="bg-gradient-navy shadow-lift flex flex-col gap-3 rounded-xl px-7 py-7">
          <span className="text-[11px] font-bold tracking-wide text-[#F59A5E] uppercase">Causa-raiz</span>
          <p className="text-xl leading-snug font-extrabold text-white sm:text-2xl">{description}</p>
        </div>

        {evidence.length > 0 ? (
          <div className="flex flex-col gap-3">
            {evidence.map((item, index) => (
              <div
                key={`${item.summary}-${index}`}
                className="shadow-card flex flex-col gap-3 rounded-xl bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-start gap-4">
                  <span className="text-brand-blue text-2xl leading-none font-extrabold tabular-nums">
                    {index + 1}
                  </span>
                  <p className="text-brand-navy-900 text-sm leading-relaxed">{item.summary}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 self-start rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap sm:self-center",
                    SOURCE_BADGE_CLASS[item.source],
                  )}
                >
                  {SOURCE_LABEL[item.source]}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="shadow-card flex flex-col items-start gap-4 rounded-xl bg-[#e3f6ea] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-brand-navy-900 text-base font-extrabold">
            Quer entender o que esse diagnóstico significa para o seu negócio?
          </p>
          <p className="text-sm text-[#45505f]">
            Um especialista da Job Content revisa os números com você em 20 minutos, sem compromisso.
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="bg-whatsapp-green hover:bg-whatsapp-green-dark w-full shrink-0 rounded-full text-white hover:text-white sm:w-auto"
        >
          <a
            href={buildWhatsAppLink(
              "Olá! Vi a causa-raiz do meu diagnóstico comercial e quero entender o que isso significa pro meu negócio.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            Conversar pelo WhatsApp
          </a>
        </Button>
      </div>
    </section>
  );
}
