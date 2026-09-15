import { ClosingSection } from "@/components/diagnostic/promise/closing-section";
import { HeroSection } from "@/components/diagnostic/promise/hero-section";
import { ProblemPillarsSection } from "@/components/diagnostic/promise/problem-pillars-section";

type PromiseScreenProps = {
  /** Chamado quando a pessoa clica em qualquer CTA para iniciar a jornada. */
  onStart: () => void;
};

/**
 * Tela 1 — Promessa/entrada da ferramenta, no layout aprovado (3 dobras:
 * hero com ilustração de iceberg, problema + 3 pilares, entregáveis +
 * fechamento). Fonte Montserrat, escopada só a esta tela via a classe
 * "promise-screen" (ver src/app/globals.css) — o resto do produto segue
 * com Plus Jakarta Sans/Inter.
 *
 * As animações de entrada e da ilustração são só CSS (@media
 * prefers-reduced-motion, ver globals.css), não framer-motion — por isso
 * este componente não precisa ser "use client" nem MotionConfig; só o
 * clique do CTA (onStart) exige que os botões sejam interativos, o que
 * não exige um Client Component aqui (o estado que decide "promise" vs
 * "capture" vive em DiagnosticJourney, que já é "use client").
 */
export function PromiseScreen({ onStart }: PromiseScreenProps) {
  return (
    <div className="promise-screen flex flex-1 flex-col">
      <HeroSection onStart={onStart} />
      <ProblemPillarsSection onStart={onStart} />
      <ClosingSection onStart={onStart} />
    </div>
  );
}
