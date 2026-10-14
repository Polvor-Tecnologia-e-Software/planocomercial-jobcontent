"use client";

import { useEffect, useRef } from "react";

import { pushJourneyStep, type JourneyStepKey, type JourneyStepParams } from "@/lib/analytics/data-layer";

/**
 * Dispara o evento da etapa no dataLayer quando a tela aparece. Uma vez
 * por montagem (a trava com ref evita o disparo duplo do React em modo de
 * desenvolvimento); voltar à etapa ou recarregar a página dispara de novo,
 * como uma visualização de página. Não desenha nada.
 */
export function TrackJourneyStep({ step, params }: { step: JourneyStepKey; params?: JourneyStepParams }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    pushJourneyStep(step, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só ao entrar na etapa
  }, []);

  return null;
}
