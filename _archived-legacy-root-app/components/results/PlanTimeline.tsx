"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import type { GrowthPlan, PlanItem } from "@/services/ai/types";
import type { CommercialPriority } from "@/services/score-engine/types";
import { T, pillarColor } from "./tokens";
import { Clock, Zap, User, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASES = [
  { key: "30",  label: "30 dias",  focus: "Fundação & Quick Wins", color: T.brand     },
  { key: "60",  label: "60 dias",  focus: "Estruturação",          color: T.emerald   },
  { key: "90",  label: "90 dias",  focus: "Aceleração & Escala",   color: T.violet    },
] as const;

type PhaseKey = typeof PHASES[number]["key"];

// ─── Effort/impact chart data ──────────────────────────────────────────────────
function buildEffortImpactData(priorities: CommercialPriority[]) {
  return priorities.slice(0, 5).map((p) => ({
    name:   p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title,
    esforço: { low: 30, medium: 60, high: 90 }[p.effort] ?? 50,
    impacto: { low: 30, medium: 65, high: 95 }[p.impact] ?? 50,
    color:  pillarColor(p.pillar),
    pillar: p.pillar,
  }));
}

// ─── Single action card ───────────────────────────────────────────────────────
function ActionCard({ item, index, phaseColor }: { item: PlanItem; index: number; phaseColor: string }) {
  const [open, setOpen] = useState(false);

  const priorityColors: Record<string, string> = {
    alta: T.red, media: T.amber, baixa: T.emerald
  };
  const effortMap: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
  const pColor = priorityColors[item.prioridade] ?? T.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{
        borderRadius: T.rL, border: `1px solid ${T.border}`,
        background: T.bgCard, overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", color: "white", textAlign: "left",
        }}
      >
        {/* Rank circle */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: `${phaseColor}18`, border: `1px solid ${phaseColor}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 12, color: phaseColor,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 4 }}>
            {item.titulo}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
              background: `${pColor}15`, border: `1px solid ${pColor}25`, color: pColor,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {item.prioridade}
            </span>
            <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <User style={{ width: 10, height: 10 }} /> {item.responsavel}
            </span>
            <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <Zap style={{ width: 10, height: 10 }} /> {effortMap[item.esforco]}
            </span>
          </div>
        </div>

        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: T.muted, flexShrink: 0 }} />
          : <ChevronDown style={{ width: 14, height: 14, color: T.muted, flexShrink: 0 }} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 13, color: T.mutedLg, lineHeight: 1.7, marginTop: 12, marginBottom: 10 }}>
                {item.descricao}
              </p>
              {item.kpis.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    KPIs
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.kpis.map((kpi, k) => (
                      <span key={k} style={{
                        fontSize: 11, color: T.brandLight, padding: "2px 10px", borderRadius: 999,
                        background: `${T.brand}0d`, border: `1px solid ${T.brand}25`,
                      }}>
                        📊 {kpi}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface PlanTimelineProps {
  plan: GrowthPlan;
  priorities: CommercialPriority[];
}

export function PlanTimeline({ plan, priorities }: PlanTimelineProps) {
  const [activePhase, setActivePhase] = useState<PhaseKey>("30");
  const effortData = buildEffortImpactData(priorities);

  const phaseItems: Record<PhaseKey, PlanItem[]> = {
    "30": plan.plano30dias,
    "60": plan.plano60dias,
    "90": plan.plano90dias,
  };

  const activeConfig = PHASES.find(p => p.key === activePhase)!;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700 }}>
          Plano de Crescimento 90 dias
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePhase(p.key)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${activePhase === p.key ? p.color + "50" : T.border}`,
                background: activePhase === p.key ? `${p.color}12` : "transparent",
                color: activePhase === p.key ? p.color : T.muted,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        {/* Left: Action list */}
        <div>
          {/* Phase header */}
          <div style={{
            padding: "12px 16px", borderRadius: T.rL, marginBottom: 14,
            background: `${activeConfig.color}0d`, border: `1px solid ${activeConfig.color}28`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Clock style={{ width: 16, height: 16, color: activeConfig.color }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: activeConfig.color }}>{activeConfig.label}</p>
              <p style={{ fontSize: 11, color: T.muted }}>{activeConfig.focus}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {phaseItems[activePhase].map((item, i) => (
                <ActionCard key={i} item={item} index={i} phaseColor={activeConfig.color} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Effort × Impact chart + priorities */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Effort chart */}
          <div style={{
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: T.rL, padding: "16px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Prioridades por Impacto
            </p>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.mutedLg, fontSize: 10, fontFamily: T.fontBody }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div style={{ background: "hsl(222 47% 10%)", border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700 }}>{label}</p>
                        <p style={{ fontSize: 11, color: T.muted }}>Impacto: {payload[0]?.value}</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="impacto" name="Impacto" radius={[0, 4, 4, 0]}>
                    {effortData.map((d, i) => (
                      <Cell key={i} fill={d.color} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorities.slice(0, 3).map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: "12px 14px", borderRadius: T.r,
                  border: `1px solid ${pillarColor(p.pillar)}25`,
                  background: `${pillarColor(p.pillar)}07`,
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}
              >
                <TrendingUp style={{ width: 13, height: 13, color: pillarColor(p.pillar), flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{p.title}</p>
                  <p style={{ fontSize: 11, color: T.muted }}>{p.time_horizon} · Pilar {p.pillar}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
