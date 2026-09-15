import type { Dimension } from "@/types/tables";

type InboundMarketingSectionProps = {
  primaryBottleneck: Dimension | null;
  secondaryRisk: Dimension | null;
};

const JOURNEY_STAGES = [
  { label: "Atrair", description: "Tráfego qualificado chegando" },
  { label: "Converter", description: "Visitante vira lead" },
  { label: "Nutrir", description: "Lead evolui até estar pronto" },
  { label: "Qualificar", description: "Lead vira MQL com perfil e intenção" },
  { label: "Gerar oportunidade", description: "MQL passa para vendas" },
] as const;

const SEGMENT_STYLE = [
  { width: "100%", gradient: "bg-gradient-to-br from-brand-blue to-[#1aa3ff]" },
  { width: "84%", gradient: "bg-gradient-blue-light" },
  { width: "68%", gradient: "bg-gradient-navy" },
  { width: "52%", gradient: "bg-gradient-to-br from-brand-orange to-brand-orange-light" },
  { width: "36%", gradient: "bg-gradient-to-br from-brand-orange-deep to-brand-orange" },
];

const DOT_COLOR = [
  "bg-brand-blue",
  "bg-brand-blue-dark",
  "bg-brand-navy-800",
  "bg-brand-orange",
  "bg-brand-orange-deep",
];

/**
 * Seção 6 (BRD): só aparece quando o gargalo principal OU o risco
 * secundário é demanda — mesma condição usada para incluir o bloco de
 * Inbound no system prompt da Etapa 3 (src/lib/ai/commercial-plan-prompt.ts).
 * Nunca renderiza uma seção vazia.
 *
 * O schema do plano (Etapa 3) não marca cada ação com a etapa da jornada
 * de inbound a que pertence — evitamos aqui uma correspondência
 * automática por palavra-chave (arriscada, poderia rotular ação errada);
 * as ações em si já estão detalhadas na seção "Plano de 90 dias" acima.
 */
export function InboundMarketingSection({
  primaryBottleneck,
  secondaryRisk,
}: InboundMarketingSectionProps) {
  const isApplicable = primaryBottleneck === "demand" || secondaryRisk === "demand";
  if (!isApplicable) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Jornada de Inbound Marketing</h2>
        <p className="text-muted-foreground text-sm">
          A geração de demanda passa por estas etapas — as ações do plano de 90 dias acima
          atacam o ponto onde a jornada está travando.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-8 lg:flex-row">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-1.5 lg:mx-0 lg:shrink-0">
          {JOURNEY_STAGES.map((stage, index) => (
            <div key={stage.label} className="flex w-full flex-col items-center">
              <div
                className={`shadow-card flex flex-col items-center justify-center px-4 py-3.5 text-center text-white ${SEGMENT_STYLE[index].gradient}`}
                style={{
                  width: SEGMENT_STYLE[index].width,
                  clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0% 100%)",
                }}
              >
                <span className="text-sm font-extrabold">{stage.label}</span>
                {index < JOURNEY_STAGES.length - 1 ? (
                  <span className="mt-0.5 max-w-[220px] text-[11px] text-white/90">{stage.description}</span>
                ) : null}
              </div>
              {index < JOURNEY_STAGES.length - 1 ? (
                <span aria-hidden="true" className="text-brand-gray-300 -my-0.5 text-sm leading-none">
                  ▾
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4">
          {JOURNEY_STAGES.map((stage, index) => (
            <div key={stage.label} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT_COLOR[index]}`}
              />
              <div>
                <h3 className="text-brand-navy-900 text-sm font-extrabold">{stage.label}</h3>
                <span className="text-muted-foreground text-xs">{stage.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
