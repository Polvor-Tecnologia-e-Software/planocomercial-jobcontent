"use client";

import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { FunnelAnalysis, FunnelStage } from "@/services/score-engine/types";
import { T } from "./tokens";

// ─── Benchmark multipliers to derive "recommended" volumes ───────────────────
const BENCHMARK_CONV: Record<string, number> = {
  leads: 0.25, mql: 0.40, oportunidades: 0.40, propostas: 0.35,
};

function buildChartData(stages: FunnelStage[]) {
  return stages.map((s) => {
    // Recommended = current leads × benchmark conversions applied
    const leadsVol  = stages[0]?.estimated_monthly ?? 0;
    const benchPct  = s.id === "leads" ? 1 : BENCHMARK_CONV[stages[stages.findIndex(x => x.id === s.id) - 1]?.id] ?? 1;
    const prevIdx   = stages.findIndex(x => x.id === s.id);
    // Build recommended from the top down
    let recommended = s.estimated_monthly;
    if (s.id !== "leads" && prevIdx > 0) {
      const prevRecommended = stages
        .slice(0, prevIdx)
        .reduce((acc, st, i, arr) => {
          if (i === 0) return st.estimated_monthly;
          return Math.round(acc * (BENCHMARK_CONV[arr[i - 1].id] ?? 1));
        }, leadsVol);
      recommended = Math.round(prevRecommended * benchPct);
    }

    const healthColor = {
      healthy: T.emerald,
      warning: T.amber,
      critical: T.red,
    }[s.health];

    return {
      id:          s.id,
      name:        s.label,
      atual:       s.estimated_monthly,
      recomendado: Math.max(recommended, s.estimated_monthly),
      conv:        s.conversion_to_next,
      benchmark:   s.benchmark_conversion,
      gap:         s.gap_vs_benchmark,
      health:      s.health,
      healthColor,
    };
  });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: {value: number; name: string}[]; label?: string
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "hsl(222 47% 10%)", border: `1px solid ${T.borderMid}`,
      borderRadius: 10, padding: "10px 14px", minWidth: 160,
    }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: T.text }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: T.muted }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{p.value.toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Funnel visual (trapezoid shapes) ─────────────────────────────────────────
function TrapezoidFunnel({
  stages, type
}: { stages: FunnelStage[]; type: "atual" | "recomendado" }) {
  const maxVol = stages[0]?.estimated_monthly ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {stages.map((s, i) => {
        const pct = (s.estimated_monthly / maxVol) * 100;
        const healthColor = { healthy: T.emerald, warning: T.amber, critical: T.red }[s.health];
        const isRecommended = type === "recomendado";
        const color = isRecommended ? T.brand : healthColor;

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1 + (isRecommended ? 0.3 : 0), duration: 0.4 }}
            style={{ position: "relative" }}
          >
            {/* Trapezoid */}
            <div style={{
              height: 36, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "0 12px",
              margin: "0 auto",
              width: `${Math.max(pct, 20)}%`,
              borderRadius: 6,
              background: isRecommended
                ? `${color}20`
                : `${color}18`,
              border: `1px solid ${color}${isRecommended ? "40" : "30"}`,
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.mutedLg, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: T.fontDisplay }}>
                {s.estimated_monthly.toLocaleString("pt-BR")}
              </span>
            </div>

            {/* Conversion % */}
            {i < stages.length - 1 && (
              <div style={{ textAlign: "center", marginTop: 2, marginBottom: -2 }}>
                <span style={{ fontSize: 9, color: T.muted, fontFamily: T.fontMono }}>
                  ↓ {s.conversion_to_next.toFixed(0)}%
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface FunnelChartProps {
  funnel: FunnelAnalysis;
}

export function FunnelChart({ funnel }: FunnelChartProps) {
  const chartData = buildChartData(funnel.stages);

  const healthSummaryColor = {
    healthy: T.emerald, warning: T.amber, critical: T.red
  }[funnel.health_summary];

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: T.rXL, padding: "24px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            Análise do Funil Comercial
          </h3>
          <p style={{ fontSize: 13, color: T.muted }}>
            Volumes estimados vs. benchmark B2B
          </p>
        </div>
        <div style={{
          padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: `${healthSummaryColor}15`, border: `1px solid ${healthSummaryColor}30`,
          color: healthSummaryColor, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {funnel.health_summary === "healthy" ? "Saudável" : funnel.health_summary === "warning" ? "Atenção" : "Crítico"}
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ height: 220, marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: T.muted, fontSize: 11, fontFamily: T.fontBody }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: T.muted, fontSize: 10, fontFamily: T.fontMono }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="atual" name="Atual" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.healthColor} fillOpacity={0.75} />
              ))}
            </Bar>
            <Bar dataKey="recomendado" name="Recomendado" fill={T.brand} fillOpacity={0.25} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel visuals side-by-side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Atual */}
        <div style={{
          padding: "16px", borderRadius: T.rL,
          background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: T.muted, marginBottom: 12, textAlign: "center" }}>
            Funil Atual
          </p>
          <TrapezoidFunnel stages={funnel.stages} type="atual" />
        </div>

        {/* Recomendado */}
        <div style={{
          padding: "16px", borderRadius: T.rL,
          background: `${T.brand}06`, border: `1px solid ${T.brand}20`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: T.brandLight, marginBottom: 12, textAlign: "center" }}>
            Funil Potencial
          </p>
          <TrapezoidFunnel
            stages={funnel.stages.map(s => ({
              ...s,
              estimated_monthly: Math.round(s.estimated_monthly * 1.4),
              health: "healthy" as const,
            }))}
            type="recomendado"
          />
        </div>
      </div>

      {/* Lost revenue indicator */}
      {funnel.estimated_lost_revenue_pct > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 16, padding: "10px 14px", borderRadius: T.r,
            background: `${T.red}0a`, border: `1px solid ${T.red}25`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: T.muted }}>Receita potencial perdida no funil</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.red, fontFamily: T.fontDisplay }}>
            ~{funnel.estimated_lost_revenue_pct}%
          </span>
        </motion.div>
      )}
    </div>
  );
}
