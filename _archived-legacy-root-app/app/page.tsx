"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  TrendingUp, Target, Zap, BarChart3, ArrowRight,
  CheckCircle2, Users, LineChart, Brain, FileText,
  Mail, Shield, ChevronRight,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      "hsl(222 47% 6%)",
  card:    "rgba(255,255,255,0.03)",
  border:  "rgba(255,255,255,0.08)",
  muted:   "hsl(215 20% 50%)",
  mutedLg: "hsl(215 20% 62%)",
  brand:   "#0ea5e9",
  brandLt: "#38bdf8",
  emerald: "#10b981",
  amber:   "#f59e0b",
};

// ── Animation variants ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: "easeOut" as const },
  }),
};

// ── Reusable animated section wrapper ─────────────────────────────────────────
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={style}
    >
      {children}
    </motion.section>
  );
}

// ── Commercial Funnel Visual ───────────────────────────────────────────────────
const FUNNEL_STAGES = [
  { id: "leads",        label: "Leads",           value: "1.200",  sub: "visitantes/mês",  color: C.brand,   width: 100, pct: 100 },
  { id: "mql",          label: "MQLs",            value: "240",    sub: "leads qualif.",   color: "#818cf8", width: 83,  pct: 20  },
  { id: "oportunidades",label: "Oportunidades",   value: "96",     sub: "em negociação",   color: C.emerald, width: 66,  pct: 8   },
  { id: "propostas",    label: "Propostas",        value: "36",     sub: "enviadas",        color: C.amber,   width: 50,  pct: 3   },
  { id: "clientes",     label: "Clientes",         value: "18",     sub: "fechados/mês",    color: "#f472b6", width: 33,  pct: 1.5 },
];

function CommercialFunnel() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
      {/* Label top */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Estágio</span>
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Volume</span>
      </div>

      {FUNNEL_STAGES.map((stage, i) => {
        const isHov = hovered === stage.id;
        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, scaleX: 0.7 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" as const }}
            onMouseEnter={() => setHovered(stage.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${isHov ? stage.color + "40" : "rgba(255,255,255,0.06)"}`,
              background: isHov ? `${stage.color}0d` : "rgba(255,255,255,0.025)",
              transition: "all 0.2s",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Width bar fill */}
            <motion.div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                background: `${stage.color}12`,
                borderRight: `2px solid ${stage.color}30`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${stage.width}%` }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.7, ease: "easeOut" as const }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              {/* Color dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color, flexShrink: 0, boxShadow: `0 0 6px ${stage.color}60` }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{stage.label}</p>
                <p style={{ fontSize: 10, color: C.muted }}>{stage.sub}</p>
              </div>
            </div>

            <div style={{ textAlign: "right", position: "relative" }}>
              <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: isHov ? stage.color : "white", transition: "color 0.2s" }}>
                {stage.value}
              </p>
              <p style={{ fontSize: 10, color: C.muted }}>{stage.pct}% do topo</p>
            </div>
          </motion.div>
        );
      })}

      {/* Conversion arrows */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16, gap: 6, flexWrap: "wrap" }}>
        {["100% → 20%", "20% → 8%", "8% → 3%", "3% → 1.5%"].map((label, i) => (
          <span
            key={i}
            style={{
              fontSize: 10, color: C.muted,
              padding: "2px 8px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 12, fontStyle: "italic" }}>
        Funil comercial típico B2B — seu diagnóstico revelará onde está seu gargalo
      </p>
    </div>
  );
}

// ── Score Preview Card ─────────────────────────────────────────────────────────
function ScorePreview() {
  return (
    <div
      className="glass glow"
      style={{ borderRadius: 20, padding: 24, maxWidth: 340, margin: "0 auto" }}
    >
      <p style={{ fontSize: 10, color: C.muted, textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
        Exemplo de resultado
      </p>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif", fontSize: 72, fontWeight: 900, lineHeight: 1,
              background: "linear-gradient(to right, #38bdf8, #7dd3fc, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            64
          </span>
          <span style={{ fontSize: 22, color: C.muted }}>/100</span>
        </div>
        <p style={{ fontSize: 13, color: C.brand, fontWeight: 500, marginTop: 4 }}>
          Score Intermediário
        </p>
      </div>

      {/* 3 pillar bars */}
      {[
        { label: "Demanda",   val: 48, color: C.brand   },
        { label: "Conversão", val: 71, color: C.emerald },
        { label: "Escala",    val: 59, color: C.amber   },
      ].map((p) => (
        <div key={p.label} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: C.mutedLg }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{p.val}</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${p.val}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" as const }}
              style={{ height: "100%", borderRadius: 3, background: p.color }}
            />
          </div>
        </div>
      ))}

      {/* Bottleneck alert */}
      <div style={{
        marginTop: 16, borderRadius: 10,
        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
        padding: "10px 14px",
      }}>
        <p style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>⚡ Gargalo: Demanda</p>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          Poucos leads qualificados chegando ao funil
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: Target,
    title: "Demanda",
    color: C.brand,
    from: "#0ea5e9", to: "#0284c7",
    description: "Avaliamos canais, ICP, volume de leads e cadências de prospecção para medir sua capacidade de gerar oportunidades consistentes.",
    items: ["Geração de leads", "Prospecção ativa", "ICP documentado", "Canais de aquisição"],
  },
  {
    icon: Zap,
    title: "Conversão",
    color: C.emerald,
    from: "#059669", to: "#10b981",
    description: "Analisamos processo de vendas, taxas de fechamento, follow-up e material de apoio para revelar onde as oportunidades se perdem.",
    items: ["Taxa de conversão", "Processo documentado", "Follow-up sistemático", "Materiais de venda"],
  },
  {
    icon: BarChart3,
    title: "Escala",
    color: C.amber,
    from: "#d97706", to: "#f59e0b",
    description: "Medimos CRM, onboarding de vendedores, métricas financeiras e a capacidade de replicar o modelo sem perder qualidade.",
    items: ["Uso de CRM", "Onboarding estruturado", "CAC e LTV", "Replicabilidade"],
  },
];

const STEPS = [
  { n: "01", icon: Users,    title: "Informe sua empresa",    desc: "Nome e email profissional. 30 segundos."      },
  { n: "02", icon: Brain,    title: "Diagnóstico guiado",     desc: "18 perguntas em 6 módulos estratégicos."      },
  { n: "03", icon: LineChart, title: "Growth Score",          desc: "Score visual por pilar + gargalo identificado." },
  { n: "04", icon: FileText,  title: "Plano 90 dias com IA",  desc: "Ações priorizadas geradas por IA consultiva."  },
  { n: "05", icon: Mail,      title: "PDF + email",           desc: "Relatório executivo enviado em minutos."       },
];

const FEATURES = [
  "Growth Score com 3 pilares",  "Gargalo comercial identificado",
  "Análise visual do funil",     "Plano 30 / 60 / 90 dias",
  "Cadências de email",          "Cadências de WhatsApp",
  "Ideias de conteúdo B2B",     "PDF executivo para download",
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden" }}>

      {/* ── Ambient glows ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: "40%", width: 1000, height: 600, borderRadius: "50%", background: "rgba(14,165,233,0.07)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: "60%", right: -200, width: 600, height: 500, borderRadius: "50%", background: "rgba(16,185,129,0.05)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "44px 44px" }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,14,23,0.85)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(14,165,233,0.3)" }}>
              <TrendingUp style={{ width: 16, height: 16, color: "white" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15 }}>
              Growth Planner <span style={{ color: C.brandLt }}>B2B</span>
              <sup style={{ fontSize: 9, color: C.muted, marginLeft: 1 }}>™</sup>
            </span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald, display: "inline-block", boxShadow: `0 0 6px ${C.emerald}` }} />
              Gratuito
            </span>
            <Link href="/onboarding" style={{ textDecoration: "none" }}>
              <button style={{ padding: "8px 20px", borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(14,165,233,0.3)" }}>
                Iniciar diagnóstico
              </button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section style={{ position: "relative", zIndex: 1, paddingTop: 128, paddingBottom: 80, padding: "128px 24px 96px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

            {/* Left: copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ marginBottom: 20 }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 14px", borderRadius: 999,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", color: C.brandLt,
                }}>
                  <TrendingUp style={{ width: 12, height: 12 }} />
                  Diagnóstico Comercial B2B com IA
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" as const }}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(36px, 4.5vw, 56px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  marginBottom: 20,
                }}
              >
                Descubra por que sua{" "}
                <span style={{
                  background: "linear-gradient(to right, #38bdf8, #7dd3fc, #34d399)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  máquina comercial
                </span>{" "}
                não está crescendo
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.5 }}
                style={{ fontSize: 17, color: C.mutedLg, lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}
              >
                Em 8 minutos, analise os 3 pilares do crescimento B2B —{" "}
                <strong style={{ color: "white", fontWeight: 500 }}>Demanda, Conversão e Escala</strong> — e receba um plano de ação personalizado para os próximos 90 dias.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}
              >
                <Link href="/onboarding" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "14px 28px", borderRadius: 12,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      color: "white", fontWeight: 700, fontSize: 16, border: "none",
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: "0 4px 24px rgba(14,165,233,0.35)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(14,165,233,0.45)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(14,165,233,0.35)"; }}
                  >
                    Iniciar diagnóstico gratuito
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </button>
                </Link>
                <span style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                  <Shield style={{ width: 13, height: 13 }} />
                  Gratuito · 8 min · Sem cartão
                </span>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap" }}
              >
                {[
                  { n: "18", label: "perguntas estratégicas" },
                  { n: "6", label: "módulos comerciais" },
                  { n: "3", label: "pilares analisados" },
                ].map((stat) => (
                  <div key={stat.n} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: C.brandLt }}>{stat.n}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Score preview */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" as const }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <ScorePreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FUNNEL SECTION
      ════════════════════════════════════════════════ */}
      <Section style={{ position: "relative", zIndex: 1, padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div variants={fadeUp} custom={0} style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              O funil que vamos analisar
            </p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, marginBottom: 12 }}>
              Onde estão seus leads se perdendo?
            </h2>
            <p style={{ color: C.mutedLg, maxWidth: 520, margin: "0 auto", fontSize: 15, lineHeight: 1.7 }}>
              Cada empresa tem um gargalo dominante. O Growth Planner identifica em qual etapa do funil sua operação perde mais valor.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            {/* Funnel visual */}
            <motion.div variants={fadeUp} custom={1}>
              <CommercialFunnel />
            </motion.div>

            {/* Gargalo types */}
            <motion.div variants={fadeUp} custom={2} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Gargalo de Demanda", desc: "Poucos leads chegando. Foco em geração e prospecção.", color: C.brand, icon: "📥" },
                { title: "Gargalo de Conversão", desc: "Leads chegam mas não fecham. Foco em processo e follow-up.", color: C.emerald, icon: "⚡" },
                { title: "Gargalo de Escala", desc: "Resultados bons mas não replicáveis. Foco em processo e CRM.", color: C.amber, icon: "📈" },
              ].map((g) => (
                <div
                  key={g.title}
                  style={{
                    borderRadius: 14, padding: "16px 20px",
                    border: `1px solid ${g.color}20`,
                    background: `${g.color}08`,
                    display: "flex", alignItems: "flex-start", gap: 14,
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{g.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: g.color, marginBottom: 4 }}>{g.title}</p>
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{g.desc}</p>
                  </div>
                </div>
              ))}

              <Link href="/onboarding" style={{ textDecoration: "none", marginTop: 4 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px", borderRadius: 12,
                  background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.14)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,0.08)"; }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.brandLt }}>
                    Descobrir meu gargalo agora
                  </span>
                  <ChevronRight style={{ width: 16, height: 16, color: C.brand }} />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          3 PILLARS
      ════════════════════════════════════════════════ */}
      <Section style={{ position: "relative", zIndex: 1, padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div variants={fadeUp} custom={0} style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.14em" }}>Os 3 pilares do crescimento</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800 }}>
              Analisamos cada dimensão da sua operação
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {PILLARS.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} custom={i + 1}>
                <div
                  className="glass glass-hover"
                  style={{ borderRadius: 20, padding: 28, height: "100%" }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 13,
                    background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20, boxShadow: `0 6px 20px ${p.from}30`,
                  }}>
                    <p.icon style={{ width: 24, height: 24, color: "white" }} />
                  </div>

                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10, color: p.color }}>
                    {p.title}
                  </h3>
                  <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>{p.description}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.items.map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 style={{ width: 13, height: 13, color: p.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.mutedLg }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <Section style={{ position: "relative", zIndex: 1, padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div variants={fadeUp} custom={0} style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.brand, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.14em" }}>Como funciona</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800 }}>
              Do zero ao plano em 8 minutos
            </h2>
          </motion.div>

          <div style={{ position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", left: 23, top: 28, bottom: 28, width: 2, background: "linear-gradient(to bottom, #0ea5e9, rgba(14,165,233,0.1))", borderRadius: 1, zIndex: 0 }} />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                custom={i + 1}
                style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20, position: "relative", zIndex: 1 }}
              >
                {/* Step number circle */}
                <div style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: "50%",
                  background: i === 0 ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(14,165,233,0.1)",
                  border: `2px solid ${i === 0 ? "transparent" : "rgba(14,165,233,0.25)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: i === 0 ? "0 4px 16px rgba(14,165,233,0.3)" : "none",
                }}>
                  <s.icon style={{ width: 20, height: 20, color: i === 0 ? "white" : C.brand }} />
                </div>

                <div
                  className="glass glass-hover"
                  style={{ flex: 1, borderRadius: 14, padding: "16px 20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: C.muted }}>{s.n}</span>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════ */}
      <Section style={{ position: "relative", zIndex: 1, padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div variants={fadeUp} custom={0} style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, marginBottom: 10 }}>
              Tudo que você recebe
            </h2>
            <p style={{ color: C.mutedLg, fontSize: 15 }}>
              Um relatório completo de consultoria digital — gratuito.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={1}
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={f}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.025)",
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 style={{ width: 13, height: 13, color: C.emerald }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════ */}
      <Section style={{ position: "relative", zIndex: 1, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <motion.div variants={fadeUp} custom={0}>
            <div
              className="glass glow"
              style={{ borderRadius: 28, padding: "56px 40px" }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, marginBottom: 14, lineHeight: 1.15 }}>
                Pronto para descobrir seu{" "}
                <span style={{
                  background: "linear-gradient(to right, #38bdf8, #7dd3fc, #34d399)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  Growth Score
                </span>
                ?
              </h2>
              <p style={{ color: C.mutedLg, fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
                8 minutos. Diagnóstico gratuito. Plano de ação personalizado com IA.
              </p>

              <Link href="/onboarding" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "16px 36px", borderRadius: 14,
                    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                    color: "white", fontWeight: 700, fontSize: 17, border: "none",
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 28px rgba(14,165,233,0.4)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 36px rgba(14,165,233,0.5)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 28px rgba(14,165,233,0.4)"; }}
                >
                  Iniciar diagnóstico agora
                  <ArrowRight style={{ width: 20, height: 20 }} />
                </button>
              </Link>

              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
                {["Gratuito", "Sem cadastro prévio", "Protegido pela LGPD"].map((t) => (
                  <span key={t} style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 style={{ width: 12, height: 12, color: C.emerald }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.muted }}>
          © {new Date().getFullYear()} Growth Planner B2B™ · Todos os direitos reservados ·{" "}
          <a href="#" style={{ color: C.muted, textDecoration: "none" }}>Política de Privacidade</a>
        </p>
      </footer>

    </div>
  );
}
