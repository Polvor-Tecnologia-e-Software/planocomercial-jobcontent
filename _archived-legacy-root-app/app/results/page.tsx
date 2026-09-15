"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import { calculateGrowthScores, SCORE_LEVELS } from "@/server/score-engine";
import { runScoreEngine } from "@/services/score-engine";
import { useGeneratePlan } from "@/hooks/useGeneratePlan";
import type { DiagnosticAnswer, GrowthScores } from "@/types";
import type { ScoreEngineOutput } from "@/services/score-engine";
import { TrendingUp, Download, RefreshCw, Share2 } from "lucide-react";
import Link from "next/link";

// ─── Dashboard components ──────────────────────────────────────────────────────
import { GrowthScoreHero }   from "@/components/results/GrowthScoreHero";
import { FunnelChart }       from "@/components/results/FunnelChart";
import { BottleneckPanel }   from "@/components/results/BottleneckPanel";
import { PlanTimeline }      from "@/components/results/PlanTimeline";
import { ContentCadence }    from "@/components/results/ContentCadence";
import { AIGeneratorPanel }  from "@/components/results/AIGeneratorPanel";
import { DeliveryModal }     from "@/components/results/DeliveryModal";
import { T } from "@/components/results/tokens";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, title, subtitle, children }: {
  id: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 40 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800,
          letterSpacing: "-0.01em", lineHeight: 1.2,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── Sticky section nav ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "score",      label: "Score"     },
  { id: "funil",      label: "Funil"     },
  { id: "gargalos",   label: "Gargalos"  },
  { id: "plano",      label: "Plano"     },
  { id: "conteudos",  label: "Conteúdos" },
];

function SectionNav({ activeSection }: { activeSection: string }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: "4px",
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 12, overflowX: "auto",
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: isActive ? 700 : 500,
              border: `1px solid ${isActive ? T.brand + "45" : "transparent"}`,
              background: isActive ? `${T.brand}12` : "transparent",
              color: isActive ? T.brandLight : T.muted,
              textDecoration: "none", whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `3px solid ${T.brand}25`, borderTopColor: T.brand,
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: T.muted, fontSize: 14 }}>Calculando seu diagnóstico...</p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [engine, setEngine]   = useState<ScoreEngineOutput | null>(null);
  const [scores, setScores]   = useState<GrowthScores | null>(null);
  const [company, setCompany] = useState("");
  const [email,   setEmail]   = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("score");
  const [modalOpen, setModalOpen] = useState(false);

  const {
    status, progress, statusText, plan, error, generate,
  } = useGeneratePlan();

  // ── Load data from sessionStorage ──────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("gp_answers");
    const c   = sessionStorage.getItem("gp_company");
    if (!raw || !c) { router.replace("/onboarding"); return; }

    const answers: DiagnosticAnswer[] = JSON.parse(raw);
    setScores(calculateGrowthScores(answers, DIAGNOSTIC_QUESTIONS));
    setEngine(runScoreEngine(answers, DIAGNOSTIC_QUESTIONS));
    setEmail(sessionStorage.getItem("gp_email") ?? "");
    setCompany(c);
    setMounted(true);
  }, [router]);

  // ── Section observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [mounted]);

  const handleGenerate = useCallback(() => {
    if (!engine || !company) return;
    generate(company, engine.ai_payload as Parameters<typeof generate>[1]);
  }, [engine, company, generate]);

  if (!mounted || !scores || !engine) return <LoadingScreen />;

  const isPlanReady = status === "done" && plan !== null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>

      {/* ── Ambient background ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -120, left: "30%",
          width: 600, height: 400, borderRadius: "50%",
          background: `${T.level[scores.nivel as keyof typeof T.level] ?? T.brand}08`,
          filter: "blur(90px)",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: `${T.emerald}05`, filter: "blur(80px)",
        }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.25,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 24px",
        borderBottom: `1px solid ${T.border}`,
        background: "rgba(10,13,20,0.9)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{
          maxWidth: 1000, margin: "0 auto", height: 56,
          display: "flex", alignItems: "center", gap: 20,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp style={{ width: 13, height: 13, color: "white" }} />
            </div>
            <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 13, color: T.text }}>
              Growth Planner <span style={{ color: T.brandLight }}>B2B</span>
            </span>
          </Link>

          {/* Section nav */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SectionNav activeSection={activeSection} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
                color: T.mutedLg, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.borderMid; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
            >
              <Download style={{ width: 13, height: 13 }} /> PDF
            </button>
            <Link href="/onboarding" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "transparent", border: `1px solid ${T.border}`,
                color: T.muted, cursor: "pointer", fontFamily: "inherit",
              }}>
                <RefreshCw style={{ width: 12, height: 12 }} /> Refazer
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Company + completion bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
        >
          <div>
            <p style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 2 }}>
              Relatório de diagnóstico comercial
            </p>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {company}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: `${T.emerald}10`, border: `1px solid ${T.emerald}25`, color: T.emeraldLt,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.emeraldLt }} />
              {engine.completion_pct}% completo · {engine.answers_count} respostas
            </div>
          </div>
        </motion.div>

        {/* ── 1. Score ── */}
        <Section id="score" title="Growth Score" subtitle="Análise dos 3 pilares da máquina comercial">
          <GrowthScoreHero engine={engine} companyName={company} />
        </Section>

        {/* ── 2. Funil ── */}
        <Section id="funil" title="Funil Comercial" subtitle="Análise de conversão e benchmark por etapa">
          <FunnelChart funnel={engine.funnel_analysis} />
        </Section>

        {/* ── 3. Gargalos ── */}
        <Section id="gargalos" title="Gargalos & Radar" subtitle="Onde a operação perde mais valor">
          <BottleneckPanel engine={engine} />
        </Section>

        {/* ── AI Generator (idle → generating → done) ── */}
        <AIGeneratorPanel
          status={status}
          progress={progress}
          statusText={statusText}
          error={error}
          scores={scores}
          companyName={company}
          diagnosis={plan?.diagnostico ?? null}
          onGenerate={handleGenerate}
        />

        {/* ── 4. Plano 90 dias (only after AI done) ── */}
        <AnimatePresence>
          {isPlanReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Section id="plano" title="Plano 30 / 60 / 90 dias" subtitle="Ações priorizadas por fase com KPIs e responsáveis">
                <PlanTimeline plan={plan!} priorities={engine.priorities} />
              </Section>

              {/* ── 5. Conteúdos & Cadências ── */}
              <Section id="conteudos" title="Conteúdos & Cadências" subtitle="Estratégia de conteúdo e sequências de prospecção">
                <ContentCadence plan={plan!} />
              </Section>

              {/* ── Bottom CTA ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  borderRadius: T.rXL, padding: "32px",
                  background: `linear-gradient(135deg, ${T.brand}0a, ${T.emerald}06)`,
                  border: `1px solid ${T.brand}20`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Próximo passo
                </p>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 800, maxWidth: 400, lineHeight: 1.3 }}>
                  Baixe o PDF executivo e compartilhe com o seu time
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={() => setModalOpen(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 28px", borderRadius: 10,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      color: "white", fontWeight: 700, fontSize: 14, border: "none",
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
                    }}
                  >
                    <Download style={{ width: 16, height: 16 }} /> Baixar PDF executivo
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: `Growth Score ${company}`, text: `Meu Growth Score B2B: ${scores.overall}/100` });
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 20px", borderRadius: 10,
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                      color: T.mutedLg, fontWeight: 600, fontSize: 14,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <Share2 style={{ width: 15, height: 15 }} /> Compartilhar
                  </button>
                </div>
                <p style={{ fontSize: 11, color: T.muted }}>
                  Seus dados são protegidos pela LGPD · Growth Planner B2B™
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── Delivery modal ── */}
      {isPlanReady && plan && (
        <DeliveryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          engine={engine!}
          plan={plan}
          companyName={company}
          email={email}
        />
      )}
    </div>
  );
}
