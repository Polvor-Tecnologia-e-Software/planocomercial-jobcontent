type ProblemPillarsSectionProps = {
  onStart: () => void;
};

const PILLARS = [
  {
    index: "01",
    title: "Demanda",
    text: "Entenda se sua empresa está gerando oportunidades suficientes, e com a qualidade necessária.",
    icon: (
      <>
        <polyline className="promise-pillar-icon-shape" points="6,34 18,22 26,30 42,10" />
        <polyline className="promise-pillar-icon-shape" points="30,10 42,10 42,22" />
      </>
    ),
  },
  {
    index: "02",
    title: "Conversão",
    text: "Identifique em qual ponto do processo comercial as oportunidades estão se perdendo.",
    icon: <path className="promise-pillar-icon-shape" d="M6,10 H42 L27,27 V38 L21,42 V27 L6,10 Z" />,
  },
  {
    index: "03",
    title: "Escala",
    text: "Descubra se existem processos, ferramentas e previsibilidade suficientes para sustentar o crescimento.",
    icon: (
      <>
        <polyline className="promise-pillar-icon-shape" points="24,6 42,16 24,26 6,16 24,6" />
        <polyline className="promise-pillar-icon-shape" points="6,24 24,34 42,24" />
        <polyline className="promise-pillar-icon-shape" points="6,32 24,42 42,32" />
      </>
    ),
  },
];

/**
 * Dobra 2 do layout aprovado — o problema (meta clara, caminho não) e os
 * 3 pilares que o diagnóstico avalia (mesmas dimensões representadas na
 * ilustração de iceberg da dobra 1: Demanda, Conversão, Escala).
 */
export function ProblemPillarsSection({ onStart }: ProblemPillarsSectionProps) {
  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-16">
        <div className="mb-12 flex max-w-[640px] flex-col gap-4">
          <h2 className="max-w-[26ch] text-2xl leading-tight font-bold text-brand-navy-900 sm:text-[34px]">
            Sua meta de vendas pode estar clara. O caminho até ela, nem tanto.
          </h2>
          <p className="max-w-[58ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Você precisa gerar mais demanda? Melhorar suas conversões? Organizar o processo
            comercial para escalar? O Plano Comercial 90 Dias analisa sua empresa nesses três
            pilares.
          </p>
        </div>

        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="promise-pillar-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className="stop-promise-pillar-a"></stop>
              <stop offset="1" className="stop-promise-pillar-b"></stop>
            </linearGradient>
          </defs>
        </svg>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.index}
              className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-white p-7"
            >
              <svg className="mb-2 size-16" viewBox="0 0 48 48" aria-hidden="true">
                {pillar.icon}
              </svg>
              <span className="text-[13px] font-extrabold text-brand-blue-dark">{pillar.index}</span>
              <h3 className="text-lg font-bold text-brand-navy-900">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={onStart} className="promise-cta-button">
          Criar meu Plano Comercial
        </button>
      </div>
    </section>
  );
}
