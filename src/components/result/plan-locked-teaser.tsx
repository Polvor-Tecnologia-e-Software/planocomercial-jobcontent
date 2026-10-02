import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";

/**
 * Teaser de sugestões bloqueadas — seção 100% estática (nenhum dado vem da
 * IA nem do plano gerado): o texto é sempre o mesmo, genérico, só para
 * sinalizar que existe mais conteúdo disponível na execução com a Job
 * Content. Isso é de propósito — gerar mais sugestões reais pra esconder
 * atrás de um blur custaria tokens de IA à toa, já que ninguém nunca lê o
 * conteúdo desbloqueado aqui (ele existe só como prova visual de volume).
 * O título usa LOCKED_CARDS.length (6), nunca um número hardcoded solto.
 */
const LOCKED_CARDS = [
  {
    tag: "Blog",
    title: "4 pautas extras de blog",
    description: "Títulos, subtítulos e estrutura completa com H2 para os próximos meses.",
  },
  {
    tag: "Nutrição",
    title: "Sequência de 5 e-mails",
    description: "Assunto, pré-cabeçalho e texto de cada e-mail do fluxo de nutrição.",
  },
  {
    tag: "Mídia paga",
    title: "Criativos para LinkedIn e Google",
    description: "Títulos, textos e segmentações prontos para subir nas campanhas.",
  },
  {
    tag: "CRM",
    title: "Scripts da cadência comercial",
    description: "Mensagens prontas para cada etapa do funil comercial.",
  },
  {
    tag: "Redes sociais",
    title: "8 posts de divulgação",
    description: "Legenda, arte sugerida e CTA prontos para cada rede.",
  },
  {
    tag: "Landing page",
    title: "Textos completos da LP",
    description: "Headline, bullets e prova social para novas seções da página.",
  },
] as const;

type PlanLockedTeaserProps = {
  /** Mês selecionado nas abas de plan-month-detail.tsx, ex.: "Mês 1". */
  monthLabel: string;
  /** Total real de ações do mês (plan90Days[mês].length) — mostra o volume de trabalho de verdade, nunca um número inventado. */
  actionsCount: number;
};

export function PlanLockedTeaser({ monthLabel, actionsCount }: PlanLockedTeaserProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-whatsapp-green flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Lock className="size-4 text-white" aria-hidden="true" />
          </span>
          <h4 className="text-brand-navy-900 text-lg font-extrabold">
            Mais {LOCKED_CARDS.length} sugestões para o {monthLabel}
          </h4>
          <span className="bg-whatsapp-green/10 text-whatsapp-green-dark rounded-full px-2.5 py-1 text-xs font-bold">
            Bloqueadas
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-[#F6F8FB]">
          <div className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {LOCKED_CARDS.map((card) => (
              <div key={card.tag} className="flex flex-col gap-3 rounded-lg border border-[#E0E5EE] bg-white p-4">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[11px] font-bold">
                    {card.tag}
                  </span>
                  <Lock className="size-4 text-[#8A94A8]" aria-hidden="true" />
                </div>
                <p className="text-[15px] leading-snug font-bold text-[#0B1A33]">{card.title}</p>
                <p className="text-[13px] leading-relaxed text-[#56627A]">{card.description}</p>
                <div aria-hidden="true" className="flex select-none flex-col gap-1.5 blur-[3px]">
                  <div className="h-2 w-[90%] rounded bg-[#D5DCE7]" />
                  <div className="h-2 w-[70%] rounded bg-[#D5DCE7]" />
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-b from-[#F6F8FB]/0 via-[#F6F8FB]/90 to-[#F6F8FB]" />
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-6 text-center">
            <p className="max-w-lg text-[15px] leading-snug font-bold text-[#0B1A33]">
              Pautas extras, e-mails, criativos e scripts de venda prontos para a sua empresa. Fale com um
              especialista para liberar.
            </p>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="bg-whatsapp-green hover:bg-whatsapp-green-dark rounded-full text-white hover:text-white"
            >
              <a
                href={buildWhatsAppLink(
                  "Olá! Vi no meu Plano Comercial Inteligente em 90 Dias que há mais sugestões bloqueadas e quero desbloqueá-las.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-5" />
                Desbloquear pelo WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="border-whatsapp-green/40 bg-whatsapp-green/5 flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-brand-navy-900 text-base font-extrabold">
            São {actionsCount} ações só neste mês. Quer que a Job Content execute com você?
          </p>
          <p className="text-sm text-[#45505f]">
            Nossa equipe cuida de SEO, mídia, landing pages, CRM e conteúdo, com relatório semanal de avanço.
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
              `Olá! Vi as ${actionsCount} ações do meu Plano Comercial Inteligente em 90 Dias e quero ajuda da Job Content para executar.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            Quero ajuda para executar
          </a>
        </Button>
      </div>
    </div>
  );
}
