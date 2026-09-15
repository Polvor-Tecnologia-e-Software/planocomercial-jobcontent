import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

type SiteHeaderProps = {
  /**
   * Progresso da jornada (0 a 100). Quando omitido, nenhuma barra é
   * exibida — útil para telas fora do fluxo do diagnóstico, como a
   * promessa inicial.
   */
  progress?: number;
};

/**
 * Cabeçalho fixo — fundo em degradê escuro (navy → azul) com uma faixa
 * de 4px em degradê azul → laranja na base, alinhado ao layout aprovado
 * para a tela de resultado. O logo usa a variante clara (branca) porque
 * o arquivo original foi pensado para fundo claro (ver
 * src/components/layout/logo.tsx).
 *
 * Usado em todas as telas da jornada, EXCETO a tela inicial (Promise
 * Screen) — que já tem sua própria logo grande no hero e não é
 * renderizada dentro deste componente (ver diagnostic-journey.tsx).
 *
 * A barra de progresso por macroetapa (seção 3.1 do BRD: sem expor
 * contagem rígida de perguntas em jornadas adaptativas) fica logo abaixo,
 * como elemento próprio (não absoluto) — sobre o fundo claro da página,
 * para não competir visualmente com a faixa de acento escura do
 * cabeçalho nem ficar cortada por ele.
 */
export function SiteHeader({ progress }: SiteHeaderProps) {
  return (
    <div className="sticky top-0 z-10">
      <header className="bg-gradient-navy relative py-5">
        <Container className="relative flex items-center justify-between">
          <Link
            href="/"
            className="focus-visible:ring-offset-brand-navy-900 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2"
          >
            <Logo variant="light" />
          </Link>
        </Container>
        <div
          aria-hidden="true"
          className="from-brand-blue via-brand-orange to-brand-orange-deep absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r"
        />
      </header>
      {typeof progress === "number" ? (
        <div className="bg-muted h-1.5 w-full overflow-hidden">
          <div
            className="bg-gradient-brand-blue h-full rounded-r-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      ) : null}
    </div>
  );
}
