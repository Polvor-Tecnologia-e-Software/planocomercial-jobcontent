import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dimensionLabel } from "@/components/result/dimension-labels";
import { cn } from "@/lib/utils";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

type HeroSectionProps = {
  companyName: string;
  generatedAt: string;
  executiveDiagnosis: string;
  primaryBottleneck: Dimension | null;
  dataQualityPercentage: number | null;
  confidence: ConfidenceLevel | null;
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/**
 * Seção 1 (BRD): a primeira coisa que a pessoa vê. Diagnóstico executivo
 * em destaque, 3 cartões de contexto (gargalo, qualidade de dados,
 * confiança) — deliberadamente SEM os scores detalhados por dimensão
 * aqui, para não competir pela atenção com o diagnóstico em si. O risco
 * secundário não aparece mais como cartão (pedido do usuário) — segue
 * calculado e usado internamente para decidir a seção de Inbound
 * Marketing (ver inbound-marketing-section.tsx), só não é mais exibido.
 */
export function HeroSection({
  companyName,
  generatedAt,
  executiveDiagnosis,
  primaryBottleneck,
  dataQualityPercentage,
  confidence,
}: HeroSectionProps) {
  const formattedDate = new Date(generatedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <Badge className="w-fit gap-2 py-2">
            <span className="relative flex size-1.5">
              <span className="bg-white/60 absolute inline-flex h-full w-full animate-ping rounded-full" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>
            Seu Plano Comercial está pronto
          </Badge>
          <span className="text-muted-foreground text-sm font-semibold">{formattedDate}</span>
        </div>
        <h1 className="text-brand-navy-900 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {companyName}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-[#3c4b60] sm:text-lg">
          {executiveDiagnosis}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HeroStatCard
          label="Principal gargalo"
          value={dimensionLabel(primaryBottleneck)}
          border="blue"
          valueTone="orange"
        />
        <HeroStatCard
          label="Qualidade dos dados"
          value={dataQualityPercentage !== null ? `${dataQualityPercentage}%` : "—"}
          border="blue"
          valueTone="blue"
        />
        <HeroStatCard
          label="Confiança do diagnóstico"
          value={confidence ? CONFIDENCE_LABEL[confidence] : "—"}
          border="orange"
        />
      </div>
    </section>
  );
}

const BORDER_CLASS = {
  blue: "border-t-brand-blue",
  navy: "border-t-brand-navy-800",
  orange: "border-t-brand-orange",
} as const;

const VALUE_TONE_CLASS = {
  orange: "text-brand-orange-deep",
  blue: "text-brand-blue-dark",
} as const;

function HeroStatCard({
  label,
  value,
  border,
  valueTone,
}: {
  label: string;
  value: string;
  border: keyof typeof BORDER_CLASS;
  valueTone?: keyof typeof VALUE_TONE_CLASS;
}) {
  return (
    <Card className={cn("border-t-4 py-0 shadow-card", BORDER_CLASS[border])}>
      <CardContent className="flex flex-col gap-2 p-5">
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        <span
          className={cn(
            "text-brand-navy-900 text-xl font-extrabold",
            valueTone && VALUE_TONE_CLASS[valueTone],
          )}
        >
          {value}
        </span>
      </CardContent>
    </Card>
  );
}
