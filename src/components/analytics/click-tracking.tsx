"use client";

import { useEffect } from "react";

import { diagnosticIdFromPath, isClickEventKey, pushClickEvent } from "@/lib/analytics/data-layer";

/**
 * Um único ouvinte de cliques para a página inteira: qualquer elemento
 * marcado com data-gtm-click="whatsapp" (e opcionalmente
 * data-gtm-local="topo") envia o evento de clique ao dataLayer. Assim
 * botões dentro de Server Components (que não têm onClick) também são
 * medidos. Fase de captura: registra antes de o link abrir outra aba.
 */
export function ClickTracking() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-gtm-click]") : null;
      if (!target) return;
      const key = target.dataset.gtmClick;
      if (!isClickEventKey(key)) return;
      pushClickEvent(key, {
        local: target.dataset.gtmLocal,
        diagnostico_id: diagnosticIdFromPath(window.location.pathname),
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
