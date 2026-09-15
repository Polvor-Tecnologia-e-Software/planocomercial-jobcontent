"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis,
} from "recharts";
import type { Bottleneck } from "@/services/score-engine/types";
import type { ScoreEngineOutput } from "@/services/score-engine";
import { T } from "./tokens";
import { AlertTriangle, Zap, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

// ─── Radar data builder ───────────────────────────────────────────────────────
function buildRadarData(engine: ScoreEngineOutput) {
  return [
    { subject: "Demanda",     score: engine.scores.demanda,   fullMark: 100 },
    { subject: "Conversão",   score: engine.scores.conversao, fullMark: 100 },
    { subject: "Escala",      score: engine.scores.escala,    fullMark: 100 },
    { subject: "Metas",       score: engine.company_profile.has_goals    ? 70 : 20, fullMark: 100 },
    { subject: "CRM",         score: engine.company_profile.uses_crm     ? 75 : 15, fullMark: 100 },
    { subject: "ICP",         score: engine.company_profile.has_icp      ? 65 : 20, fullMark: 100 },
  ];
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_META = {
  critical: { label: "Crítico",  color: T.red,    bg: `${T.red}10`,    border: `${T.red}28`    },
  moderate: { label: "Moderado", color: T.amber,  bg: `${T.amber}10`,  border: `${T.amber}28`  },
  mild:     { label: "Leve",     color: T.emerald,bg: `${T.emerald}10`,border: `${T.emerald}28` },
};

// ─── Single bottleneck card ───────────────────────────────────────────────────
function BottleneckCard({
  bottleneck, isMain, delay
}: { bottleneck: Bottleneck; isMain: boolean; delay: number }) {
  const [expanded, setExpanded] = useState(isMain);
  const meta = SEVERITY_META[bottleneck.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        borderRadius: T.rL,
        border: `1px solid ${isMain ? meta.color + "35" : T.border}`,
        background: isMain ? meta.bg : T.bgCard,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%", padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
          color: "white", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${meta.color}20`, border: `1px solid ${meta.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: meta.color }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{bottleneck.title}</p>
              {isMain && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 999,
                  background: `${meta.color}20`, border: `1px solid ${meta.color}35`,
                  color: meta.color,
                }}>Principal</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: meta.color,
                padding: "1px 8px", borderRadius: 999,
                background: `${meta.color}15`, border: `1px solid ${meta.color}25`,
              }}>
                {meta.label}
              </span>
              <span style={{ fontSize: 11, color: T.muted }}>
                Score: {bottleneck.score}/100
              </span>
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp style={{ width: 16, height: 16, color: T.muted }} />
          : <ChevronDown style={{ width: 16, height: 16, color: T.muted }} />
        }
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 13, color: T.mutedLg, lineHeight: 1.7, marginTop: 14, marginBottom: 12 }}>
                {bottleneck.description}
              </p>

              {/* Business impact */}
              <div style={{
                padding: "10px 14px", borderRadius: T.r, marginBottom: 14,
                background: `${meta.color}08`, border: `1px solid ${meta.color}20`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Impacto no negócio
                </p>
                <p style={{ fontSize: 13, color: T.mutedLg, lineHeight: 1.6 }}>
                  {bottleneck.business_impact}
                </p>
              </div>

              {/* Quick wins */}
              <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Quick Wins
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bottleneck.quick_wins.slice(0, 3).map((win, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Zap style={{ width: 12, height: 12, color: meta.color, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: T.mutedLg, lineHeight: 1.6 }}>{win}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface BottleneckPanelProps {
  engine: ScoreEngineOutput;
}

export function BottleneckPanel({ engine }: BottleneckPanelProps) {
  const radarData = buildRadarData(engine);
  const mainBotScore = engine.bottlenecks[0]?.score ?? 0;
  const mainColor = SEVERITY_META[engine.bottlenecks[0]?.severity ?? "moderate"].color;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

      {/* Left: Bottleneck cards */}
      <div>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
          Gargalos Identificados
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {engine.bottlenecks.map((b, i) => (
            <BottleneckCard key={b.type} bottleneck={b} isMain={i === 0} delay={i * 0.12} />
          ))}
        </div>
      </div>

      {/* Right: Radar + insights */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Radar */}
        <div style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: T.rXL, padding: "20px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${mainColor}07 0%, transparent 70%)`, pointerEvents: "none" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Radar Comercial
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: T.muted, fontSize: 11, fontFamily: T.fontBody }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={mainColor}
                  fill={mainColor}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            {
              label: "ICP Definido",
              value: engine.company_profile.has_icp ? "Sim" : "Não",
              ok: engine.company_profile.has_icp,
            },
            {
              label: "CRM Ativo",
              value: engine.company_profile.uses_crm ? "Sim" : "Não",
              ok: engine.company_profile.uses_crm,
            },
            {
              label: "Metas Definidas",
              value: engine.company_profile.has_goals ? "Sim" : "Não",
              ok: engine.company_profile.has_goals,
            },
            {
              label: "CAC/LTV Known",
              value: engine.company_profile.knows_cac_ltv ? "Sim" : "Não",
              ok: engine.company_profile.knows_cac_ltv,
            },
          ].map((ins) => (
            <div key={ins.label} style={{
              padding: "10px 12px", borderRadius: T.r,
              background: ins.ok ? `${T.emerald}08` : `${T.red}08`,
              border: `1px solid ${ins.ok ? T.emerald : T.red}25`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <CheckCircle2 style={{ width: 13, height: 13, color: ins.ok ? T.emerald : T.red, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{ins.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: ins.ok ? T.emerald : T.red }}>{ins.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
