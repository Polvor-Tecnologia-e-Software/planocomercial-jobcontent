"use client";

import { useState, useCallback } from "react";
import type { ScoreEngineOutput } from "@/services/score-engine";
import type { GrowthPlan } from "@/services/ai/types";

export type DeliveryStatus = "idle" | "generating" | "done" | "error";

export interface DeliveryFormData {
  phone:     string;
  job_title: string;
  website:   string;
  lgpd:      boolean;
}

export interface DeliveryResult {
  pdf_url:      string;
  file_size_kb: number;
  mocked:       boolean;
  rd_success:   boolean;
}

export function useDeliver() {
  const [status,  setStatus]  = useState<DeliveryStatus>("idle");
  const [result,  setResult]  = useState<DeliveryResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [step,    setStep]    = useState<string>("");

  const deliver = useCallback(async (
    form:        DeliveryFormData,
    engine:      ScoreEngineOutput,
    plan:        GrowthPlan,
    companyName: string,
    email:       string,
  ) => {
    if (!form.lgpd) {
      setError("É necessário aceitar os termos da LGPD para continuar.");
      return;
    }

    setStatus("generating");
    setError(null);
    setStep("Gerando relatório PDF...");

    try {
      const res = await fetch("/api/deliver", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name:    companyName,
          email,
          phone:           form.phone   || undefined,
          job_title:       form.job_title || undefined,
          website:         form.website  || undefined,
          engine,
          plan,
          lgpd_consent:    form.lgpd,
          lgpd_consent_at: new Date().toISOString(),
          lgpd_version:    process.env.NEXT_PUBLIC_LGPD_POLICY_VERSION || "1.0.0",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      setStep("Pronto!");
      setResult({
        pdf_url:      data.pdf?.signed_url   ?? "",
        file_size_kb: data.pdf?.file_size_kb ?? 0,
        mocked:       data.pdf?.mocked       ?? false,
        rd_success:   data.rd?.success       ?? false,
      });
      setStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar entrega.";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setStep("");
  }, []);

  return { status, result, error, step, deliver, reset };
}
