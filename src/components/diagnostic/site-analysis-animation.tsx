"use client";

import { useEffect, useRef } from "react";

import animationData from "@/components/diagnostic/animations/site-analysis.json";

/**
 * Animação "busca e analytics" (Lottie, JSON fornecido pelo time) da tela
 * de espera da análise do site. lottie-web é carregado só aqui, sob
 * demanda (import dinâmico), para não pesar nas outras telas. Com
 * prefers-reduced-motion, mostra um quadro parado em vez de animar.
 */
export function SiteAnalysisAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let destroy: (() => void) | undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void import("lottie-web").then(({ default: lottie }) => {
      if (cancelled) return;
      const animation = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: !reducedMotion,
        autoplay: !reducedMotion,
        animationData,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      if (reducedMotion) animation.goToAndStop(90, true);
      destroy = () => animation.destroy();
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  // Proporção do quadro original (3415 x 2500) reservada desde o início — sem pulo de layout ao carregar.
  return <div ref={containerRef} aria-hidden="true" className="aspect-[3415/2500] w-full" />;
}
