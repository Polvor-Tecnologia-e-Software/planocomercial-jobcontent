"use client";

import { useState, useCallback, useRef } from "react";
import type { GrowthPlan, StreamEvent } from "@/services/ai/types";
import type { AIPayload } from "@/services/score-engine/types";

export type GenerationStatus =
  | "idle"
  | "connecting"
  | "generating"
  | "done"
  | "error";

export interface UseGeneratePlanState {
  status:     GenerationStatus;
  progress:   number;
  statusText: string;
  plan:       GrowthPlan | null;
  error:      string | null;
  rawChunks:  string;  // accumulated raw text (for debug)
}

export interface UseGeneratePlanActions {
  generate: (companyName: string, aiPayload: AIPayload, diagnosticId?: string) => void;
  reset:    () => void;
}

const INITIAL_STATE: UseGeneratePlanState = {
  status:     "idle",
  progress:   0,
  statusText: "",
  plan:       null,
  error:      null,
  rawChunks:  "",
};

export function useGeneratePlan(): UseGeneratePlanState & UseGeneratePlanActions {
  const [state, setState] = useState<UseGeneratePlanState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (companyName: string, aiPayload: AIPayload, diagnosticId?: string) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({
        ...INITIAL_STATE,
        status:     "connecting",
        statusText: "Conectando...",
        progress:   2,
      });

      try {
        const response = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name:  companyName,
            diagnostic_id: diagnosticId,
            ai_payload:    aiPayload,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        setState((s) => ({ ...s, status: "generating" }));

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? ""; // keep incomplete chunk

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            let event: StreamEvent;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue; // skip malformed event
            }

            handleEvent(event);
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // intentional cancel

        setState((s) => ({
          ...s,
          status:     "error",
          error:      "Falha na conexão. Verifique sua internet e tente novamente.",
          statusText: "Erro de conexão",
        }));
      }

      function handleEvent(event: StreamEvent) {
        switch (event.type) {
          case "status":
            setState((s) => ({ ...s, statusText: event.message }));
            break;

          case "progress":
            setState((s) => ({ ...s, progress: event.pct }));
            break;

          case "chunk":
            setState((s) => ({ ...s, rawChunks: s.rawChunks + event.text }));
            break;

          case "done":
            setState((s) => ({
              ...s,
              status:     "done",
              progress:   100,
              statusText: "Plano gerado com sucesso!",
              plan:       event.plan,
            }));
            break;

          case "error":
            setState((s) => ({
              ...s,
              status:     "error",
              statusText: "Erro ao gerar plano",
              error:      event.message,
            }));
            break;
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, generate, reset };
}
