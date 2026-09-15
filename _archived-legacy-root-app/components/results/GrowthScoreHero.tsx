"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ScoreEngineOutput } from "@/services/score-engine";
import { T, glow } from "./tokens";
import { Target, Zap, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 1400, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const t0  = useRef<number | null>(null);
  useEffect(() => {
    const run = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [to, duration]);
  return <>{val}{suffix}</>;
}

// ─── Half-circle arc gauge ────────────────────────────────────────────────────
function ArcGauge({ score, color }: { score: number; color: string }) {
  const R = 88; const sw = 11;
  const circ = Math.PI * R;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width={220} height={122} viewBox="0 0 220 122" style={{ overflow: "visible" }}>
      {/* Track */}
      <path d={`M 11 110 A ${R} ${R} 0 0 1 209 110`} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={sw} strokeLinecap="round" />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Fill */}
      <motion.path
        d={`M 11 110 A ${R} ${R} 0 0 1 209 110`}
        fill="none" stroke="url(#arcGrad)" strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
        style={{ filter: `drop-shadow(0 0 10px ${color}70)` }}
      />
      {/* Tick marks at 25/50/75 */}
      {[25, 50, 75].map((pct) => {
        const angle = Math.PI * (1 - pct / 100);
        const cx = 110 + (R + 18) * Math.cos(Math.PI - angle);
        const cy = 110 - (R + 18) * Math.sin(Math.PI - angle);
        return (
          <text key={pct} x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily={T.fontMono}>
            {pct}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Pillar bar row ───────────────────────────────────────────────────────────
function PillarRow({
  label, score, color, icon: Icon, delay
}: { label: string; score: number; color: string; icon: React.ElementType; delay: number }) {
  const levelLabel = score >= 70 ? "Forte" : score >= 45 ? "Em desenvolvimento" : "Crítico";
  const levelColor = score >= 70 ? T.emerald : score >= 45 ? T.amber : T.red;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "14px 18px", borderRadius: T.rL,
        border: `1px solid ${T.border}`,
        background: T.bgCard,
        transition: "border-color 0.2s",
      }}
      whileHover={{ borderColor: `${color}35` } as never}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `${color}15`, border: `1px solid ${color}25`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Icon style={{ width: 15, height: 15, color }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{label}</p>
            <p style={{ fontSize: 11, color: levelColor, fontWeight: 500, marginTop: 1 }}>{levelLabel}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
            <Counter to={score} duration={1300} />
          </span>
          <span style={{ fontSize: 12, color: T.muted }}>/100</span>
        </div>
      </div>

      {/* Bar */}
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.15, duration: 1.1, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 3,
            background: `linear-gradient(to right, ${color}aa, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>

      {/* Benchmark hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {score >= 70
          ? <TrendingUp style={{ width: 12, height: 12, color: T.emerald }} />
          : score >= 45
          ? <Minus style={{ width: 12, height: 12, color: T.amber }} />
          : <TrendingDown style={{ width: 12, height: 12, color: T.red }} />
        }
        <span style={{ fontSize: 11, color: T.muted }}>
          {score >= 70 ? "Acima do benchmark B2B" : score >= 45 ? "Próximo ao benchmark B2B" : "Abaixo do benchmark B2B"}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface GrowthScoreHeroProps {
  engine: ScoreEngineOutput;
  companyName: string;
}

const LEVEL_LABEL: Record<string, string> = {
  critico: "Crítico", basico: "Básico",
  intermediario: "Intermediário", avancado: "Avançado", elite: "Elite",
};

export function GrowthScoreHero({ engine, companyName }: GrowthScoreHeroProps) {
  const { scores, maturity } = engine;
  const scoreColor = T.level[scores.level as keyof typeof T.level] ?? T.brand;

  const PILLARS = [
    { label: "Demanda",   score: scores.demanda,   color: T.pillar.demanda,   icon: Target   },
    { label: "Conversão", score: scores.conversao, color: T.pillar.conversao, icon: Zap      },
    { label: "Escala",    score: scores.escala,    color: T.pillar.escala,    icon: BarChart3 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

      {/* Left: Arc gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          ...{background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.rXL},
          padding: "28px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${scoreColor}0d 0%, transparent 70%)`, pointerEvents: "none" }} />

        <p style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
          Growth Score · {companyName}
        </p>

        <div style={{ position: "relative", marginBottom: 0 }}>
          <ArcGauge score={scores.overall} color={scoreColor} />
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 58, fontWeight: 900, lineHeight: 1,
              color: scoreColor, filter: `drop-shadow(0 0 18px ${scoreColor}60)`,
            }}>
              <Counter to={scores.overall} />
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>de 100</div>
          </div>
        </div>

        {/* Level badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 16px", borderRadius: 999,
            fontSize: 13, fontWeight: 700,
            background: `${scoreColor}18`, border: `1px solid ${scoreColor}35`,
            color: scoreColor,
          }}>
            {LEVEL_LABEL[scores.level] ?? scores.level}
          </span>
          <p style={{ fontSize: 12, color: T.muted, textAlign: "center", maxWidth: 220, lineHeight: 1.6 }}>
            {maturity.description}
          </p>
        </motion.div>

        {/* Archetype */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{
            marginTop: 16, padding: "8px 14px", borderRadius: T.r,
            background: "rgba(255,255,255,0.035)", border: `1px solid ${T.border}`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}
        >
          <p style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Arquétipo comercial</p>
          <p style={{ fontSize: 12, color: T.mutedLg, fontWeight: 500 }}>{maturity.archetype.replace(/_/g, " ")}</p>
        </motion.div>
      </motion.div>

      {/* Right: Pillar rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PILLARS.map((p, i) => (
          <PillarRow key={p.label} {...p} delay={0.3 + i * 0.12} />
        ))}

        {/* Points to next level */}
        {maturity.next_level && maturity.points_to_next > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              padding: "10px 14px", borderRadius: T.r,
              background: `${T.brand}08`, border: `1px solid ${T.brand}20`,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <TrendingUp style={{ width: 14, height: 14, color: T.brandLight, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: T.brandLight, lineHeight: 1.5 }}>
              <strong>{maturity.points_to_next} pontos</strong> para o nível{" "}
              <strong>{LEVEL_LABEL[maturity.next_level]}</strong>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
