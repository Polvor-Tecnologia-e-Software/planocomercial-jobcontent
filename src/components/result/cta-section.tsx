import { Button } from "@/components/ui/button";
import { DownloadPdfButton } from "@/components/result/download-pdf-button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";

type CtaSectionProps = {
  diagnosticId: string;
};

/** Seção 10 (BRD) + botão de download em PDF (Etapa 5) + WhatsApp (Etapa 7). */
export function CtaSection({ diagnosticId }: CtaSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="bg-gradient-cta shadow-lift relative overflow-hidden rounded-xl px-8 py-10 sm:px-10 sm:py-11">
        <div
          aria-hidden="true"
          className="bg-brand-orange-deep/35 pointer-events-none absolute -top-40 -right-32 size-[420px] rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-2.5">
          <h2 className="text-2xl font-extrabold text-white sm:text-[27px]">
            Seu plano mostra o que precisa mudar. Agora é hora de executar.
          </h2>
          <p className="max-w-xl text-sm text-white/90 sm:text-base">
            A Job Content pode ajudar a transformar essas prioridades em processo,
            campanhas, automação, CRM e geração de oportunidades.
          </p>
        </div>
        <div className="relative mt-7 flex flex-col gap-3.5 sm:flex-row">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="bg-whatsapp-green hover:bg-whatsapp-green-dark shadow-whatsapp-green/30 hover:shadow-whatsapp-green/40 w-full rounded-full text-white shadow-lg hover:text-white sm:w-auto"
          >
            <a
              href={buildWhatsAppLink(
                "Olá! Acabei de receber meu Plano Comercial Inteligente em 90 Dias e quero conversar com um especialista sobre como executá-lo.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon className="size-5" />
              Falar com um especialista
            </a>
          </Button>
          <DownloadPdfButton diagnosticId={diagnosticId} />
        </div>
      </div>
    </section>
  );
}
