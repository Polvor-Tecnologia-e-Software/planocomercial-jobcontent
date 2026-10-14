import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { ClickTracking } from "@/components/analytics/click-tracking";
import { TrackJourneyStep } from "@/components/analytics/track-journey-step";
import {
  CLICK_EVENTS,
  diagnosticIdFromPath,
  JOURNEY_STEPS,
  pushClickEvent,
  pushJourneyStep,
} from "@/lib/analytics/data-layer";

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

beforeEach(() => {
  delete (window as DataLayerWindow).dataLayer;
});

describe("pushJourneyStep", () => {
  it("envia o evento da etapa com número e nome, criando o dataLayer se ainda não existir", () => {
    pushJourneyStep("phone", { diagnostico_id: "d-1", desafio: "D2" });

    expect((window as DataLayerWindow).dataLayer).toEqual([
      { event: "etapa_06_telefone", etapa_numero: 6, etapa_nome: "telefone", diagnostico_id: "d-1", desafio: "D2" },
    ]);
  });

  it("omite parâmetros vazios em vez de enviar null/''", () => {
    pushJourneyStep("result", { diagnostico_id: "d-1", desafio: null, gargalo_principal: "" });
    expect((window as DataLayerWindow).dataLayer?.[0]).toEqual({
      event: "etapa_08_resultado",
      etapa_numero: 8,
      etapa_nome: "resultado",
      diagnostico_id: "d-1",
    });
  });

  it("todos os eventos seguem o padrão etapa_NN_nome e começam pelo número da etapa", () => {
    for (const step of Object.values(JOURNEY_STEPS)) {
      expect(step.event).toMatch(/^etapa_\d{2}_[a-z_]+$/);
      expect(step.event.startsWith(`etapa_${String(step.number).padStart(2, "0")}_`)).toBe(true);
    }
  });
});

describe("TrackJourneyStep", () => {
  it("dispara uma única vez ao aparecer, mesmo no modo estrito do React", () => {
    render(
      <StrictMode>
        <TrackJourneyStep step="landing" />
      </StrictMode>,
    );
    const events = (window as DataLayerWindow).dataLayer ?? [];
    expect(events.filter((item) => item.event === "etapa_01_landing")).toHaveLength(1);
  });
});

describe("eventos de clique", () => {
  it("diagnosticIdFromPath lê o id só de /diagnostico/{uuid}", () => {
    expect(diagnosticIdFromPath("/diagnostico/86c50321-6a2b-4a7d-b77d-2c9b9dc592e5")).toBe(
      "86c50321-6a2b-4a7d-b77d-2c9b9dc592e5",
    );
    expect(diagnosticIdFromPath("/diagnostico")).toBeUndefined();
  });

  it("ClickTracking envia clique_whatsapp com o local do botão marcado", async () => {
    render(
      <>
        <ClickTracking />
        <a href="#x" data-gtm-click="whatsapp" data-gtm-local="topo">
          <span>Falar com um especialista</span>
        </a>
      </>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Falar com um especialista"));

    expect((window as DataLayerWindow).dataLayer).toEqual([{ event: "clique_whatsapp", local: "topo" }]);
  });

  it("ClickTracking ignora elementos sem marcação ou com um evento desconhecido", async () => {
    render(
      <>
        <ClickTracking />
        <button type="button">Sem marcação</button>
        <button type="button" data-gtm-click="inventado">
          Evento desconhecido
        </button>
      </>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Sem marcação"));
    await user.click(screen.getByText("Evento desconhecido"));

    expect((window as DataLayerWindow).dataLayer ?? []).toEqual([]);
  });

  it("pushClickEvent usa os nomes fixos de CLICK_EVENTS", () => {
    pushClickEvent("pdf", { diagnostico_id: "d-1", local: "cta_final" });
    expect((window as DataLayerWindow).dataLayer).toEqual([
      { event: CLICK_EVENTS.pdf, diagnostico_id: "d-1", local: "cta_final" },
    ]);
  });
});
