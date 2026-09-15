type ClosingSectionProps = {
  onStart: () => void;
};

const DELIVERABLES = [
  "Identificação do seu principal gargalo de crescimento",
  "Plano de ação dividido em 30, 60 e 90 dias",
  "Checklist com as ações prioritárias para os próximos 7 dias",
];

/**
 * Dobra 3 do layout aprovado — o que a pessoa recebe ao final (lista de
 * entregáveis) e o fechamento, num cartão sempre claro (garante contraste
 * sobre o degradê fixo da seção, independente do tema do SO).
 */
export function ClosingSection({ onStart }: ClosingSectionProps) {
  return (
    <section className="bg-gradient-promise-closing py-16 text-white sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[26ch] text-2xl leading-tight font-bold sm:text-[34px]">
              Mais do que um diagnóstico. Um plano do que fazer a partir dele.
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-white/80 sm:text-lg">
              Ao finalizar, você recebe uma análise da sua operação, incluindo:
            </p>

            <div className="mt-7 flex flex-col gap-3.5">
              {DELIVERABLES.map((item) => (
                <div key={item} className="flex items-start gap-3 text-[15px] leading-relaxed">
                  <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-navy-800">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="shadow-promise-elevated flex flex-col items-start gap-4 rounded-xl border border-brand-gray-light bg-white p-7 sm:p-10">
            <h3 className="text-[22px] font-bold text-brand-navy-900">
              Pare de decidir o próximo passo comercial no achismo.
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Entenda onde sua operação está hoje e o que deve entrar na sua prioridade nos
              próximos 90 dias.
            </p>

            <button type="button" onClick={onStart} className="promise-cta-button">
              Criar meu Plano Comercial
            </button>

            <p className="text-[13px] text-muted-foreground">
              PS: você não entra em nenhuma sequência de vendas automática só por responder o
              diagnóstico.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
