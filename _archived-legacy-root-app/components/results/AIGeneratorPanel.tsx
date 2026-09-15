"use client";

import { motion } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle2, FileText } from "lucide-react";
import type { GrowthScores } from "@/types";
import type { GenerationStatus } from "@/hooks/useGeneratePlan";
import { T } from "./tokens";

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, statusText }: { pct: number; statusText: string }) {
  const steps = [
    { label: "Analisando dados",    threshold: 15  },
    { label: "Construindo plano",   threshold: 50  },
    { label: "Gerando cadências",   threshold: 80  },
    { label: "Finalizando",         threshold: 95  },
  ];

  const currentStep = steps.findLast(s => pct >= s.threshold) ?? steps[0];

  return (
    <div style={{ width: "100%", maxWidth: 500 }}>
      {/* Steps */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        {steps.map((step, i) => {
          const done = pct >= step.threshold;
          const active = currentStep.label === step.label;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: done ? T.brand : active ? T.brandLight : "rgba(255,255,255,0.1)",
                transition: "background 0.4s",
                boxShadow: done ? `0 0 6px ${T.brand}80` : "none",
              }} />
              <span style={{ fontSize: 9, color: done ? T.mutedLg : T.muted, textAlign: "center", maxWidth: 60 }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bar */}
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(to right, ${T.brandDark}, ${T.brandLight})`,
            boxShadow: `0 0 8px ${T.brand}60`,
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: T.mutedLg }}>{statusText}</span>
        <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AIGeneratorPanelProps {
  status:       GenerationStatus;
  progress:     number;
  statusText:   string;
  error:        string | null;
  scores:       GrowthScores;
  companyName:  string;
  diagnosis:    string | null;  // from plan.diagnostico once done
  onGenerate:   () => void;
}

export function AIGeneratorPanel({
  status, progress, statusText, error, scores, companyName, diagnosis, onGenerate,
}: AIGeneratorPanelProps) {
  const scoreColor = T.level[scores.nivel as keyof typeof T.level] ?? T.brand;

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          borderRadius: T.rXL, padding: "32px",
          background: `linear-gradient(135deg, ${T.brand}0a 0%, ${T.brand}04 100%)`,
          border: `1px solid ${T.brand}28`,
          position: "relative", overflow: "hidden",
          marginBottom: 24,
        }}
      >
        {/* Glow */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `${T.brand}08`, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, position: "relative" }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 28px rgba(14,165,233,0.35)",
            }}
          >
            <Sparkles style={{ width: 30, height: 30, color: "white" }} />
          </motion.div>

          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
              Pronto para o seu plano estratégico?
            </h2>
            <p style={{ color: T.mutedLg, fontSize: 14, lineHeight: 1.75, maxWidth: 500 }}>
              Nossa IA consultiva vai gerar um plano de 90 dias personalizado para o gargalo de{" "}
              <strong style={{ color: "white" }}>{scores.gargalo_principal}</strong>{" "}
              da <strong style={{ color: "white" }}>{companyName}</strong>, com cadências comerciais completas.
            </p>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { n: "30/60/90", label: "dias de plano" },
              { n: "5+", label: "cadências comerciais" },
              { n: "8+", label: "conteúdos sugeridos" },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, color: T.brandLight }}>{s.n}</p>
                <p style={{ fontSize: 11, color: T.muted }}>{s.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onGenerate}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 36px", borderRadius: 12,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "white", fontWeight: 700, fontSize: 15, border: "none",
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(14,165,233,0.4)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
          >
            <Sparkles style={{ width: 18, height: 18 }} />
            Gerar plano com IA
          </button>
          <p style={{ fontSize: 11, color: T.muted }}>~20 segundos · Powered by GPT-4o Mini · Gratuito</p>
        </div>
      </motion.div>
    );
  }

  // ── Connecting / Generating ───────────────────────────────────────────────
  if (status === "connecting" || status === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          borderRadius: T.rXL, padding: "40px 32px",
          background: T.bgCard, border: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Animated logo */}
        <div style={{ position: "relative" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              border: `3px solid ${T.brand}25`, borderTopColor: T.brand,
            }}
          />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles style={{ width: 20, height: 20, color: T.brandLight }} />
          </div>
        </div>

        <ProgressBar pct={progress} statusText={statusText || "Iniciando..."} />

        <p style={{ fontSize: 12, color: T.muted, textAlign: "center", maxWidth: 380, lineHeight: 1.7 }}>
          A IA está analisando o perfil de <strong style={{ color: T.mutedLg }}>{companyName}</strong> e construindo um plano estratégico personalizado para o gargalo de <strong style={{ color: T.mutedLg }}>{scores.gargalo_principal}</strong>...
        </p>
      </motion.div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          borderRadius: T.rXL, padding: "28px",
          background: `${T.red}08`, border: `1px solid ${T.red}28`,
          textAlign: "center", marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 14, color: T.redLt, marginBottom: 16 }}>⚠️ {error}</p>
        <button
          onClick={onGenerate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px",
            borderRadius: 10, background: "rgba(255,255,255,0.06)", color: "white",
            fontWeight: 600, fontSize: 13, border: `1px solid ${T.border}`,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} /> Tentar novamente
        </button>
      </motion.div>
    );
  }

  // ── Done: show the executive diagnosis ───────────────────────────────────
  if (status === "done" && diagnosis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          borderRadius: T.rXL, padding: "24px",
          background: T.bgCard, border: `1px solid ${T.border}`,
          marginBottom: 24, position: "relative", overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(to right, ${T.brand}, ${T.emerald})`,
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `${T.brand}15`, border: `1px solid ${T.brand}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText style={{ width: 15, height: 15, color: T.brandLight }} />
          </div>
          <div>
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700 }}>
              Diagnóstico Executivo
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <CheckCircle2 style={{ width: 11, height: 11, color: T.emerald }} />
              <span style={{ fontSize: 11, color: T.emerald }}>Gerado por IA · {companyName}</span>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: 14, color: T.mutedLg, lineHeight: 1.85,
          borderLeft: `3px solid ${T.brand}40`, paddingLeft: 16,
          whiteSpace: "pre-line",
        }}>
          {diagnosis}
        </p>
      </motion.div>
    );
  }

  return null;
}
