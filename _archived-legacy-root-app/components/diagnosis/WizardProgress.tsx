"use client";

import { motion } from "framer-motion";
import type { DiagnosticModule } from "@/types";

const MODULE_LABELS: Record<DiagnosticModule, string> = {
  momento_atual: "Momento",
  meta_comercial: "Metas",
  demanda: "Demanda",
  conversao: "Conversão",
  processo_escala: "Escala",
  inteligencia_mercado: "Mercado",
};

const MODULE_ORDER: DiagnosticModule[] = [
  "momento_atual",
  "meta_comercial",
  "demanda",
  "conversao",
  "processo_escala",
  "inteligencia_mercado",
];

interface ModuleStatus {
  module: DiagnosticModule;
  total: number;
  answered: number;
  isActive: boolean;
  isComplete: boolean;
}

interface WizardProgressProps {
  currentIndex: number;
  total: number;
  progressPercent: number;
  moduleProgress: ModuleStatus[];
  company: string;
}

const C = {
  bg: "hsl(222 47% 6%)",
  muted: "hsl(215 20% 45%)",
  mutedLight: "hsl(215 20% 55%)",
  brand: "#0ea5e9",
  brandLight: "#38bdf8",
  emerald: "#10b981",
  border: "rgba(255,255,255,0.07)",
};

export function WizardProgress({
  currentIndex,
  total,
  progressPercent,
  moduleProgress,
  company,
}: WizardProgressProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Top bar: company + counter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: C.mutedLight,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 200,
          }}
        >
          {company || "Diagnóstico"}
        </span>
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {currentIndex + 1}
          <span style={{ opacity: 0.5 }}>/{total}</span>
        </span>
      </div>

      {/* Main progress bar */}
      <div className="progress-track" style={{ marginBottom: 20 }}>
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
        />
      </div>

      {/* Module steps — hidden on mobile, shown md+ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 4,
        }}
        className="module-steps"
      >
        {moduleProgress.map((mod, i) => {
          const label = MODULE_LABELS[mod.module];
          const pct =
            mod.total > 0 ? (mod.answered / mod.total) * 100 : 0;

          return (
            <div key={mod.module} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {/* Fill bar per module */}
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: mod.isComplete
                    ? C.emerald
                    : mod.isActive
                    ? "rgba(14,165,233,0.25)"
                    : "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {mod.isActive && pct > 0 && (
                  <motion.div
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(to right, ${C.brand}, ${C.brandLight})`,
                      borderRadius: 2,
                    }}
                  />
                )}
                {mod.isComplete && (
                  <div style={{ width: "100%", height: "100%", background: C.emerald }} />
                )}
              </div>
              {/* Label */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: mod.isComplete
                    ? C.emerald
                    : mod.isActive
                    ? C.brandLight
                    : C.muted,
                  textAlign: "center",
                  transition: "color 0.3s",
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
