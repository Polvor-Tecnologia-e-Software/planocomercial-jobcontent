import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { dimensionLabel } from "@/components/result/dimension-labels";
import { buildWhatsAppLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

type HeroSectionProps = {
  companyName: string;
  generatedAt: string;
  executiveDiagnosis: string;
  primaryBottleneck: Dimension | null;
  dataQualityPercentage: number | null;
  confidence: ConfidenceLevel | null;
  leadsCurrent: number | null;
  leadsRequired: number | null;
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/**
 * Seção 1 (BRD), redesenhada a partir do layout de referência anexado
 * (pedido explícito: "o topo do diagnóstico precisa ficar igual esse") —
 * faixa azul-marinho de ponta a ponta (quebra o container com margem
 * negativa calc(50%-50vw), já que a página inteira vive dentro de
 * Container size="wide") com o selo, o diagnóstico executivo e os dois
 * CTAs, seguida pelos 4 cartões brancos com metade sobre o fundo azul
 * (margin-top negativo). O logo da Job já aparece no header global
 * (SiteHeader usa Logo variant="light") — nenhuma logo nova é desenhada
 * aqui, só o conteúdo real do diagnóstico. O 4º cartão (Leads por mês) é
 * novo: current/required do estágio "leads" do funil, já calculados em
 * src/server/get-commercial-plan-result.ts — nenhum número novo.
 */
export function HeroSection({
  companyName,
  generatedAt,
  executiveDiagnosis,
  primaryBottleneck,
  dataQualityPercentage,
  confidence,
  leadsCurrent,
  leadsRequired,
}: HeroSectionProps) {
  const formattedDate = new Date(generatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="relative flex flex-col">
      <div className="bg-gradient-navy relative mx-[calc(50%-50vw)] px-4 pt-10 pb-24 text-center sm:px-6 sm:pt-14 sm:pb-28 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="bg-brand-blue rounded-full px-3 py-1.5 text-xs font-bold text-white">
              Diagnóstico concluído
            </span>
            <span className="text-sm font-medium text-white/60">{formattedDate}</span>
          </div>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            {companyName}
          </h1>
          <p className="text-base leading-relaxed text-white/80 sm:text-lg">{executiveDiagnosis}</p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="bg-whatsapp-green hover:bg-whatsapp-green-dark w-full rounded-full text-white hover:text-white sm:w-auto"
            >
              <a
                href={buildWhatsAppLink(
                  `Olá! Acabei de ver o diagnóstico de ${companyName} e quero falar com um especialista.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-5" />
                Falar com um especialista
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <a href="#plano">Ver plano de 90 dias</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-14 grid w-full max-w-6xl grid-cols-1 gap-4 px-4 sm:-mt-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <HeroStatCard
          label="Principal gargalo"
          value={dimensionLabel(primaryBottleneck)}
          valueTone="orange"
        />
        <HeroStatCard
          label="Leads por mês"
          value={leadsCurrent !== null ? String(leadsCurrent) : "—"}
          suffix={leadsRequired !== null ? `de ${leadsRequired} necessários` : undefined}
        />
        <HeroStatCard
          label="Qualidade dos dados"
          value={dataQualityPercentage !== null ? `${dataQualityPercentage}%` : "—"}
        />
        <HeroStatCard
          label="Confiança do diagnóstico"
          value={confidence ? CONFIDENCE_LABEL[confidence] : "—"}
          valueTone="blue"
        />
      </div>
    </section>
  );
}

const VALUE_TONE_CLASS = {
  orange: "text-brand-orange-deep",
  blue: "text-brand-blue-dark",
} as const;

function HeroStatCard({
  label,
  value,
  suffix,
  valueTone,
}: {
  label: string;
  value: string;
  suffix?: string;
  valueTone?: keyof typeof VALUE_TONE_CLASS;
}) {
  return (
    <div className="shadow-card flex flex-col gap-2 rounded-2xl bg-white p-5">
      <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn("text-brand-navy-900 text-xl font-extrabold", valueTone && VALUE_TONE_CLASS[valueTone])}
        >
          {value}
        </span>
        {suffix ? <span className="text-muted-foreground text-sm font-medium">{suffix}</span> : null}
      </div>
    </div>
  );
}
