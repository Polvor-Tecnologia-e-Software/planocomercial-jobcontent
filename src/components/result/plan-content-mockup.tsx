type ContentMockupProps = {
  /** Rótulo curto acima do título (formato do material rico, ex.: "ebook"). */
  eyebrow: string;
  title: string;
  /**
   * Nome real da empresa diagnosticada — não é uma invenção: é o mesmo
   * `companyName` usado no resto da tela, nunca um nome fictício.
   * Opcional porque nem todo lugar que reaproveitar este mockup precisa
   * do rodapé de empresa.
   */
  companyName?: string;
};

/**
 * Mockup visual PADRÃO da capa do material rico do mês — pedido
 * explícito: nunca recriar uma capa fake com texto inventado (logotipo,
 * composição gráfica), só uma moldura sempre igual (capa de livro)
 * mostrando o título real gerado pela IA e o nome real da empresa (dado
 * real já disponível na tela, não uma invenção). O resto do conteúdo
 * (subtítulo, seções etc.) aparece como texto ao lado do mockup, nunca
 * desenhado dentro dele — diferente do mockup de hero de landing page
 * (ver LandingPageShowcase em plan-month-detail.tsx), que desenha o
 * formulário real dentro do mockup porque o layout de referência da LP
 * pede exatamente isso.
 */
export function ContentMockup({ eyebrow, title, companyName }: ContentMockupProps) {
  return (
    <div className="bg-muted flex justify-center rounded-xl p-9">
      <div className="bg-brand-navy-900 relative flex h-72 w-52 flex-col justify-between overflow-hidden rounded-r-xl rounded-l-sm p-6 shadow-xl">
        <span className="bg-brand-orange-deep absolute inset-y-0 left-0 w-2.5" aria-hidden="true" />
        <span className="text-[10px] font-extrabold tracking-wide text-[#F59A5E] uppercase">{eyebrow}</span>
        <p className="text-[18px] leading-snug font-extrabold text-white">{title}</p>
        {companyName ? <span className="text-[11px] font-semibold text-white/60">{companyName}</span> : null}
      </div>
    </div>
  );
}
