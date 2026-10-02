import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/contact";
import type { Competition } from "@/lib/seo/keyword-opportunity";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import { cn } from "@/lib/utils";

type SeoOpportunitiesSectionProps = {
  opportunities: KeywordOpportunity[];
};

const COMPETITION_LABEL: Record<Competition, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  unknown: "Não informada",
};

const COMPETITION_BADGE_CLASS: Record<Competition, string> = {
  low: "bg-[#E4EDFB] text-brand-blue-dark",
  medium: "bg-[#EEF1F5] text-[#3A465C]",
  high: "bg-[#FDE7D8] text-[#9A3F0B]",
  unknown: "bg-[#EEF1F5] text-muted-foreground",
};

/**
 * Oportunidades de SEO, redesenhada a partir do layout de referência
 * anexado (pedido explícito): tabela com #, palavra-chave, buscas/mês
 * estimadas, concorrência e status, seguida de um CTA de SEO. A IA
 * sugere palavras-chave relacionadas às informadas na captura, com uma
 * ESTIMATIVA de volume e concorrência (nunca dado real do Google —
 * deixado explícito no texto de apoio e no cabeçalho "(est.)", ver
 * src/lib/ai/seo-keywords-prompt.ts). Só aparece quando existe pelo
 * menos uma sugestão: sem palavras-chave informadas, ou se a chamada de
 * IA falhar, a seção não é renderizada — ver
 * src/server/analyze-seo-opportunities.ts.
 *
 * A ordenação (src/lib/seo/keyword-opportunity.ts) e o status "Nicho não
 * explorado" (src/lib/seo/keyword-coverage.ts, comparação de texto
 * determinística contra o perfil confirmado da empresa) continuam
 * aplicados de forma determinística sobre as estimativas da IA.
 */
export function SeoOpportunitiesSection({ opportunities }: SeoOpportunitiesSectionProps) {
  if (opportunities.length === 0) return null;

  const hasGap = opportunities.some((opportunity) => opportunity.coverageGap);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-brand-blue text-[11px] font-bold tracking-wide uppercase">04 · Oportunidades</span>
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Palavras-chave para a sua empresa</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Volumes estimados por IA para orientar a pauta. Não são números oficiais do Google.
          {hasGap ? " Os temas marcados ainda não aparecem no site e representam nichos a explorar." : ""}
        </p>
      </div>

      <div className="shadow-card overflow-x-auto rounded-xl bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#F6F8FB]">
            <tr className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
              <th scope="col" className="w-14 px-6 py-4 font-bold">
                #
              </th>
              <th scope="col" className="px-6 py-4 font-bold">
                Palavra-chave
              </th>
              <th scope="col" className="px-6 py-4 font-bold">
                Buscas/mês (est.)
              </th>
              <th scope="col" className="px-6 py-4 font-bold">
                Concorrência
              </th>
              <th scope="col" className="px-6 py-4 font-bold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EAF1]">
            {opportunities.map((opportunity) => (
              <tr key={opportunity.keyword}>
                <td className="text-muted-foreground px-6 py-3.5 tabular-nums">{opportunity.opportunityRank}</td>
                <td className="text-brand-navy-900 px-6 py-3.5 font-semibold">{opportunity.keyword}</td>
                <td className="text-brand-navy-900 px-6 py-3.5 tabular-nums">
                  {opportunity.avgMonthlySearches !== null
                    ? `~${opportunity.avgMonthlySearches.toLocaleString("pt-BR")}`
                    : "Não disponível"}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold",
                      COMPETITION_BADGE_CLASS[opportunity.competition],
                    )}
                  >
                    {COMPETITION_LABEL[opportunity.competition]}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  {opportunity.coverageGap ? (
                    <span className="rounded-full bg-[#FDE7D8] px-2.5 py-1 text-[11px] font-bold text-[#9A3F0B]">
                      Nicho não explorado
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start gap-4 rounded-xl bg-[#e3f6ea] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-brand-navy-900 text-[15px] font-semibold">
          Quer transformar essas palavras-chave em um calendário de conteúdo que gera leads?
        </p>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="bg-whatsapp-green hover:bg-whatsapp-green-dark w-full shrink-0 rounded-full text-white hover:text-white sm:w-auto"
        >
          <a
            href={buildWhatsAppLink(
              "Olá! Vi as palavras-chave sugeridas no meu Plano Comercial e quero transformá-las em um calendário de conteúdo.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="size-5" />
            Falar com especialista em SEO
          </a>
        </Button>
      </div>
    </section>
  );
}
