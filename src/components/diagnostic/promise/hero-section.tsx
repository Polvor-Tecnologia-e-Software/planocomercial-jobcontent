import { Logo } from "@/components/layout/logo";

type HeroSectionProps = {
  onStart: () => void;
};

/**
 * Dobra 1 do layout aprovado — headline, subheadline, CTA e a ilustração
 * de iceberg (ponta visível = Vendas; parte submersa = Demanda,
 * Conversão, Escala — os três pilares que o diagnóstico avalia). CSS da
 * ilustração e das animações de entrada em src/app/globals.css (bloco
 * "Tela inicial"), por ser um SVG longo — mudar cor ali, não aqui.
 */
export function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="bg-gradient-promise-hero relative overflow-hidden text-white">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-16">
        <div className="py-5">
          <Logo variant="light" />
        </div>

        <div className="grid grid-cols-1 items-center gap-8 py-6 sm:gap-12 sm:py-14 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex max-w-[640px] flex-col gap-5">
            <h1
              className="promise-reveal text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[44px]"
              data-delay="1"
            >
              Descubra o que está impedindo sua empresa de crescer e receba um plano comercial
              para os próximos 90 dias.
            </h1>
            <p
              className="promise-reveal max-w-[52ch] text-base leading-relaxed text-white/85 sm:text-[19px]"
              data-delay="2"
            >
              Responda a um diagnóstico sobre sua operação de marketing e vendas e descubra onde
              estão seus gargalos, o que precisa mudar e quais ações priorizar para chegar mais
              perto da sua meta de crescimento.
            </p>

            <button
              type="button"
              onClick={onStart}
              className="promise-cta-button promise-reveal"
              data-delay="3"
            >
              Criar meu Plano Comercial
            </button>

            <p className="promise-reveal text-[13px] text-white/70" data-delay="4">
              Diagnóstico personalizado para empresas B2B. Leva poucos minutos.
            </p>
          </div>

          <div className="flex justify-center">
            <svg
              viewBox="0 0 500 500"
              role="img"
              aria-label="Ilustração de um iceberg: a ponta visível acima da linha d'água representa Vendas, e a parte submersa, mais escura, reúne Demanda, Conversão e Escala, com um ponto de gargalo identificado conectado a um plano de 30, 60 e 90 dias."
              className="w-full max-w-[320px] sm:max-w-[640px]"
            >
              <defs>
                <linearGradient
                  id="iceberg-img-deep-gradient"
                  x1="241.19"
                  y1="191.12"
                  x2="211.76"
                  y2="464.12"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" className="stop-iceberg-deep-a"></stop>
                  <stop offset="1" className="stop-iceberg-deep-b"></stop>
                </linearGradient>
              </defs>

              <g className="iceberg-img-group">
                <g className="iceberg-img-particles">
                  <circle className="iceberg-img-dust" cx="169.11" cy="334.39" r="2.66" />
                  <path
                    className="iceberg-img-dust"
                    d="M187.02,336.1c0,.67-.54,1.22-1.22,1.22s-1.22-.54-1.22-1.22.54-1.22,1.22-1.22,1.22.54,1.22,1.22Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M170.53,351.77c0,.52-.42.95-.95.95s-.95-.42-.95-.95.42-.95.95-.95.95.42.95.95Z"
                  />
                  <circle className="iceberg-img-dust" cx="129.45" cy="330.83" r="1.89" />
                  <circle className="iceberg-img-dust" cx="119.45" cy="286.77" r="1.62" />
                  <circle className="iceberg-img-dust" cx="96.74" cy="337.04" r="1.35" />
                  <path
                    className="iceberg-img-dust"
                    d="M178.51,330.21c0,.66-.54,1.2-1.2,1.2s-1.2-.54-1.2-1.2.54-1.2,1.2-1.2,1.2.54,1.2,1.2Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M154.33,339.64c0,.29-.24.53-.53.53s-.53-.24-.53-.53.24-.53.53-.53.53.24.53.53Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M192.32,357.58c0,.95-.77,1.73-1.73,1.73s-1.73-.77-1.73-1.73.77-1.73,1.73-1.73,1.73.77,1.73,1.73Z"
                  />
                  <circle className="iceberg-img-dust" cx="168.28" cy="380.16" r="1.46" />
                  <circle className="iceberg-img-dust" cx="125.51" cy="382.28" r="1.73" />
                  <path
                    className="iceberg-img-dust"
                    d="M182.23,404.87c0,.51-.42.93-.93.93s-.93-.42-.93-.93.42-.93.93-.93.93.42.93.93Z"
                  />
                  <circle className="iceberg-img-dust" cx="217.3" cy="376.31" r=".8" />
                  <path
                    className="iceberg-img-dust"
                    d="M207.47,373.25c0,.66-.54,1.2-1.2,1.2s-1.2-.54-1.2-1.2.54-1.2,1.2-1.2,1.2.54,1.2,1.2Z"
                  />
                  <circle className="iceberg-img-dust" cx="217.03" cy="367.54" r="1.33" />
                  <path
                    className="iceberg-img-dust"
                    d="M212.25,383.35c0,.66-.54,1.2-1.2,1.2s-1.2-.54-1.2-1.2.54-1.2,1.2-1.2,1.2.54,1.2,1.2Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M232.17,402.47c0,.37-.3.66-.66.66s-.66-.3-.66-.66.3-.66.66-.66.66.3.66.66Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M212.51,431.7c0,.66-.54,1.2-1.2,1.2s-1.2-.54-1.2-1.2.54-1.2,1.2-1.2,1.2.54,1.2,1.2Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M312.01,376.04c-.51,0-.93-.42-.93-.93s.42-.93.93-.93.93.42.93.93-.42.93-.93.93Z"
                  />
                  <circle className="iceberg-img-dust" cx="330.74" cy="374.71" r="1.06" />
                  <path
                    className="iceberg-img-dust"
                    d="M328.08,361.56c0,.66-.54,1.2-1.2,1.2s-1.2-.54-1.2-1.2.54-1.2,1.2-1.2,1.2.54,1.2,1.2Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M320.64,374.18c0,.15-.12.27-.27.27s-.27-.12-.27-.27.12-.27.27-.27.27.12.27.27Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M313.47,393.18c0,.51-.42.93-.93.93s-.93-.42-.93-.93.42-.93.93-.93.93.42.93.93Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M335.79,392.25c0,.88-.71,1.59-1.59,1.59s-1.59-.71-1.59-1.59.71-1.59,1.59-1.59,1.59.71,1.59,1.59Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M352.79,370.86c0,.51-.42.93-.93.93s-.93-.42-.93-.93.42-.93.93-.93.93.42.93.93Z"
                  />
                  <circle className="iceberg-img-dust" cx="320.78" cy="409.38" r="2.79" />
                  <circle className="iceberg-img-dust" cx="358.37" cy="385.6" r="1.06" />
                  <path
                    className="iceberg-img-dust"
                    d="M339.51,358.9c0,.51-.42.93-.93.93s-.93-.42-.93-.93.42-.93.93-.93.93.42.93.93Z"
                  />
                  <circle className="iceberg-img-dust" cx="327.29" cy="347.61" r="2.13" />
                  <path
                    className="iceberg-img-dust"
                    d="M365.28,293.15c0,.44-.36.8-.8.8s-.8-.36-.8-.8.36-.8.8-.8.8.36.8.8Z"
                  />
                  <circle className="iceberg-img-dust" cx="347.21" cy="302.98" r="1.06" />
                  <path
                    className="iceberg-img-dust"
                    d="M361.56,279.33c0,.29-.24.53-.53.53s-.53-.24-.53-.53.24-.53.53-.53.53.24.53.53Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M356.78,296.07c0,.44-.36.8-.8.8s-.8-.36-.8-.8.36-.8.8-.8.8.36.8.8Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M366.87,313.34c0,1.03-.83,1.86-1.86,1.86s-1.86-.83-1.86-1.86.83-1.86,1.86-1.86,1.86.83,1.86,1.86Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M394.5,295.14c0,1.25-1.01,2.26-2.26,2.26s-2.26-1.01-2.26-2.26,1.01-2.26,2.26-2.26,2.26,1.01,2.26,2.26Z"
                  />
                  <path
                    className="iceberg-img-dust"
                    d="M374.04,334.59c0,.73-.59,1.33-1.33,1.33s-1.33-.59-1.33-1.33.59-1.33,1.33-1.33,1.33.59,1.33,1.33Z"
                  />
                </g>

                <g className="iceberg-img-body">
                  <polygon
                    className="iceberg-img-base"
                    points="118.97 183.45 136.56 154.33 138.51 160.76 181.9 107.82 202.23 123.32 247.96 52.22 288.22 108.19 294.86 105.17 300.73 127.1 309.72 121.81 349.2 179.29 358.19 174.76 373.04 186.48 347.24 289.35 342.55 284.81 330.82 331.7 325.74 328.3 314.41 366.12 305.03 355.15 283.53 469.74 230.76 376.33 225.68 381.25 217.08 359.31 207.31 368.77 188.55 312.04 139.69 321.11 124.5 217.05 116.3 216.44 109.98 193.66 118.97 183.45"
                  />
                  <g>
                    <polygon
                      className="iceberg-img-facet-light"
                      points="138.57 160.69 138.51 160.76 136.56 154.33 132.98 160.27 146.85 197.32 138.57 160.69"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="241.69 73.91 235.96 70.88 202.42 123.01 215.8 156.77 241.69 73.91"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="248.32 52.72 247.96 52.22 235.96 70.88 241.69 73.91 248.32 52.72"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="276.89 92.45 248.32 52.72 241.69 73.91 276.89 92.45"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="356.12 253.93 370.95 194.82 310.72 182.46 356.12 253.93"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="113.63 206.83 116.3 216.44 124.09 217.02 173.92 196.37 113.63 206.83"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="357.81 174.94 349.2 179.29 348.86 178.8 346.46 187.52 357.81 174.94"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="294.68 105.25 288.65 108 283.36 148.13 294.68 105.25"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="318.68 134.86 309.72 121.81 300.73 127.1 300.69 126.97 290.72 168.43 318.68 134.86"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="169.74 122.65 142.06 156.43 191.79 155.22 169.74 122.65"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="135.49 292.38 139.69 321.11 139.88 321.08 211.36 252.13 135.49 292.38"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="323.47 311.06 273.37 214.11 307.06 357.52 314.41 366.12 325.74 328.3 330.82 331.7 337.33 305.68 324.3 279.28 323.47 311.06"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="286.73 415.27 255.56 312.4 251.38 403.15 246.1 379.72 243.03 387.53 234.13 347.41 230.31 376.77 230.76 376.33 283.53 469.74 296.78 399.09 287.29 384.3 286.73 415.27"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="218.54 329.64 222.16 302.98 196.15 335.01 207.31 368.77 217.08 359.31 224.49 378.22 226.34 325.6 218.54 329.64"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="268.8 141.29 274.8 120.01 222.47 166.12 268.8 141.29"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="322.35 153.58 314.36 148.89 299.02 167.37 315.3 151.76 322.35 153.58"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="165.23 158.75 172.68 166.32 192.41 158.21 165.23 158.75"
                    />
                    <polygon
                      className="iceberg-img-facet-light"
                      points="227.01 212.83 227.92 274.08 248.79 195.05 148.51 224.03 227.01 212.83"
                    />
                  </g>
                  <path
                    className="iceberg-img-shade"
                    d="M265.34,296.67c-2.89,2.09-5.77,4.17-8.66,6.26-.08-2.85-.17-5.69-.25-8.54-5.25.89-10.2,3.37-13.98,7.01-1.4-11.12-1.69-22.37-.88-33.54-8.31,7.92-16.63,15.84-24.94,23.76,1.23-24.98,2.73-49.94,4.5-74.89-11.29,4.51-22.59,9.01-33.88,13.52,3.03-8.82,7.8-17.07,13.98-24.19-14.37,2.91-28.74,5.82-43.1,8.73,6.22-8.95,39.91-18.51,39.91-18.51l-16.51-.6,26.95-22.16-18.8-2.51,32.66-13.47,17.6-33.46s-21.36,8.22-23.99,9.5c9.19-25.62,20.9-47.89,26.98-73.53l-40.7,63.28-20.33-15.51-43.39,52.95-1.95-6.43-17.59,29.12-8.99,10.21,6.32,22.77,8.2.61,15.19,104.07,48.86-9.08,18.76,56.73,9.77-9.45,8.6,21.94,5.08-4.92,50.96,90.22c-4.29-50.9-8.58-101.79-12.87-152.69-.49-5.85-1.02-11.84-3.51-17.2Z"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="300.73 127.1 297.49 155.03 290.72 168.43 300.73 127.1"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="268.8 141.29 246 159.66 222.47 166.12 268.8 141.29"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="203.25 174.46 180.23 171.98 197.4 178.34 203.25 174.46"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="202.15 127.79 211.65 154.66 189.54 125.67 201.24 135.21 202.15 127.79"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="143.87 170.74 140.4 161.73 141.86 159.25 161.77 159.25 144.6 162.61 143.87 170.74"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="274.86 98.59 281.42 109.95 262.71 125.01 277.18 109.42 274.86 98.59"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="273.63 108.89 263.8 119.99 266.12 113.25 273.63 108.89"
                  />
                  <polygon
                    className="iceberg-img-facet-accent"
                    points="284.42 125.28 281.01 156.06 280.73 130.17 284.42 125.28"
                  />
                  <polygon
                    className="iceberg-img-facet-light"
                    points="305.27 179.54 322.95 209.03 299.25 184.28 300.19 172.08 305.27 179.54"
                  />
                  <polygon
                    className="iceberg-img-facet-light"
                    points="296.99 176.81 295.3 183.55 292.29 175.9 296.99 176.81"
                  />
                </g>

                <polygon
                  className="iceberg-img-deep"
                  points="116.3 216.44 124.5 217.05 139.69 321.11 188.55 312.04 207.31 368.77 217.08 359.31 225.68 381.25 230.76 376.33 283.53 469.74 305.03 355.15 314.41 366.12 325.74 328.3 330.82 331.7 342.55 284.81 347.24 289.35 372.3 189.43 113.71 189.43 109.98 193.66 116.3 216.44"
                />
              </g>

              <text className="iceberg-label iceberg-label--tip" x="245" y="130">
                Vendas
              </text>
              <text className="iceberg-label iceberg-label--demanda" x="230" y="248">
                Demanda
              </text>
              <text className="iceberg-label iceberg-label--conversao" x="230" y="345">
                Conversão
              </text>
              <text className="iceberg-label iceberg-label--escala" x="235" y="430">
                Escala
              </text>

              <line className="iceberg-scanner" x1="95" y1="189" x2="373" y2="189"></line>

              <circle className="iceberg-gargalo-ring" cx="255" cy="345" r="13"></circle>
              <circle className="iceberg-gargalo" cx="255" cy="345" r="6"></circle>
              <rect className="iceberg-gargalo-tag" x="269" y="335" width="126" height="20" rx="4"></rect>
              <text className="iceberg-gargalo-label" x="277" y="349">
                Gargalo identificado
              </text>

              <path className="iceberg-connector" d="M261,345 C 340,345 380,400 395,430"></path>
              <g className="iceberg-milestones">
                <circle cx="395" cy="430" r="4"></circle>
                <text x="405" y="413">
                  30
                </text>
                <text x="405" y="428">
                  60
                </text>
                <text x="405" y="443">
                  90 dias
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
