/**
 * /services/pdf/document.tsx
 *
 * Executive Growth Planner PDF report.
 * Uses @react-pdf/renderer v4 — server-side only (never import in client components).
 *
 * Design: dark slate consultancy aesthetic. Clean, data-rich, professional.
 */

import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Font, Image, Link,
} from "@react-pdf/renderer";
import type { ScoreEngineOutput } from "@/services/score-engine";
import type { GrowthPlan, PlanItem } from "@/services/ai/types";

// ─── Fonts (safe system fallbacks; react-pdf bundles Helvetica) ────────────────
// We use Helvetica/Times which are built into pdfkit — no network fetches needed.

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  bg:      "#0a0d14",
  bgCard:  "#0f1520",
  bgLight: "#141c2e",
  border:  "#1e2d45",
  text:    "#e8edf5",
  muted:   "#607090",
  mutedLg: "#8ba0bf",
  brand:   "#0ea5e9",
  brandLt: "#38bdf8",
  emerald: "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
  violet:  "#8b5cf6",
  white:   "#ffffff",
  levels: {
    critico:       "#ef4444",
    basico:        "#f59e0b",
    intermediario: "#3b82f6",
    avancado:      "#10b981",
    elite:         "#0ea5e9",
  },
  pillars: {
    demanda:   "#0ea5e9",
    conversao: "#10b981",
    escala:    "#f59e0b",
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },

  // Cover
  coverPage: {
    backgroundColor: C.bg,
    flexDirection: "column",
    padding: 0,
  },
  coverTopBar: {
    backgroundColor: C.brand,
    height: 4,
    width: "100%",
  },
  coverBody: {
    padding: 48,
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverLogo: {
    fontSize: 11,
    color: C.mutedLg,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 60,
  },
  coverTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  coverSubtitle: {
    fontSize: 14,
    color: C.mutedLg,
    marginBottom: 36,
    lineHeight: 1.6,
  },
  coverScoreBox: {
    backgroundColor: C.bgCard,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  coverScoreNumber: {
    fontSize: 56,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  coverMeta: {
    fontSize: 9,
    color: C.muted,
    marginTop: 4,
  },

  // Content pages
  contentPage: {
    backgroundColor: C.bg,
    padding: 40,
    flexDirection: "column",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pageHeaderTitle: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  pageHeaderCompany: {
    fontSize: 9,
    color: C.muted,
  },

  // Sections
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: C.brand,
    marginBottom: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Cards
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 10,
    color: C.mutedLg,
    lineHeight: 1.6,
  },

  // Score pill
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Pillar row
  pillarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  pillarLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    width: 80,
  },
  pillarBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: C.bgLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  pillarBarFill: {
    height: 8,
    borderRadius: 4,
  },
  pillarScore: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 36,
    textAlign: "right",
  },

  // Funnel stage
  funnelStage: {
    flexDirection: "row",
    alignItems: "center",
    padding: "8 12",
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  funnelLabel: {
    fontSize: 10,
    color: C.text,
    flex: 1,
  },
  funnelVol: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  funnelConv: {
    fontSize: 9,
    color: C.muted,
    width: 50,
    textAlign: "right",
  },

  // Plan action
  actionCard: {
    backgroundColor: C.bgCard,
    borderRadius: 6,
    padding: "10 14",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
  },
  actionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 4,
  },
  actionBody: {
    fontSize: 9,
    color: C.mutedLg,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  actionMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionTag: {
    fontSize: 8,
    color: C.muted,
    backgroundColor: C.bgLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // KPI tag
  kpiTag: {
    fontSize: 8,
    color: C.brand,
    backgroundColor: "#0ea5e90d",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#0ea5e920",
  },

  // Bottleneck
  bottleneckCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },

  // Quick win
  quickWin: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 5,
  },
  quickWinBullet: {
    fontSize: 8,
    color: C.amber,
    marginTop: 1,
    width: 10,
  },
  quickWinText: {
    fontSize: 9,
    color: C.mutedLg,
    flex: 1,
    lineHeight: 1.4,
  },

  // Footer
  pageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },

  // Two-col grid
  twoCol: { flexDirection: "row", gap: 12 },
  col:    { flex: 1 },

  // Horizontal rule
  hr: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  // Inline badge
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
  },

  // Diagnostic text
  diagParagraph: {
    fontSize: 10,
    color: C.mutedLg,
    lineHeight: 1.7,
    marginBottom: 10,
    padding: "10 14",
    backgroundColor: C.bgCard,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function levelColor(level: string): string {
  return C.levels[level as keyof typeof C.levels] ?? C.brand;
}
function levelLabel(level: string): string {
  const map: Record<string, string> = {
    critico: "Crítico", basico: "Básico",
    intermediario: "Intermediário", avancado: "Avançado", elite: "Elite",
  };
  return map[level] ?? level;
}
function pillarColor(p: string): string {
  return C.pillars[p as keyof typeof C.pillars] ?? C.brand;
}
function priorityColor(p: string): string {
  return { alta: C.red, media: C.amber, baixa: C.emerald }[p] ?? C.muted;
}

// ─── Page header component ────────────────────────────────────────────────────
function PageHeader({ section, company }: { section: string; company: string }) {
  return (
    <View style={S.pageHeader}>
      <Text style={S.pageHeaderTitle}>{section}</Text>
      <Text style={S.pageHeaderCompany}>Growth Planner B2B™ · {company}</Text>
    </View>
  );
}

// ─── Page footer ──────────────────────────────────────────────────────────────
function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <View style={S.pageFooter}>
      <Text style={S.footerText}>Confidencial · Growth Planner B2B™</Text>
      <Text style={S.footerText}>{page} / {total}</Text>
    </View>
  );
}

// ─── Score bar row ────────────────────────────────────────────────────────────
function PillarBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <View style={S.pillarRow}>
      <Text style={S.pillarLabel}>{label}</Text>
      <View style={S.pillarBarBg}>
        <View style={[S.pillarBarFill, { width: `${score}%` as never, backgroundColor: color }]} />
      </View>
      <Text style={[S.pillarScore, { color }]}>{score}</Text>
    </View>
  );
}

// ─── Plan action card ─────────────────────────────────────────────────────────
function ActionCard({ item, index, accentColor }: { item: PlanItem; index: number; accentColor: string }) {
  return (
    <View style={[S.actionCard, { borderLeftColor: accentColor }]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={[S.actionTitle, { flex: 1, marginRight: 8 }]}>{index + 1}. {item.titulo}</Text>
        <View style={[S.badge, { backgroundColor: priorityColor(item.prioridade) + "22", borderColor: priorityColor(item.prioridade) + "44" } as never]}>
          <Text style={{ color: priorityColor(item.prioridade), fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            {item.prioridade.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={S.actionBody}>{item.descricao}</Text>
      <View style={S.actionMeta}>
        <View style={S.actionTag}><Text>👤 {item.responsavel}</Text></View>
        <View style={S.actionTag}><Text>⚡ Esforço {item.esforco}</Text></View>
        {item.kpis.slice(0, 2).map((kpi, k) => (
          <View key={k} style={S.kpiTag}><Text>📊 {kpi}</Text></View>
        ))}
      </View>
    </View>
  );
}

// ─── Main PDF document ────────────────────────────────────────────────────────
interface GrowthPlanPDFProps {
  engine:      ScoreEngineOutput;
  plan:        GrowthPlan;
  companyName: string;
  email:       string;
  generatedAt: string;
}

const TOTAL_PAGES = 7;

export function GrowthPlanPDF({ engine, plan, companyName, email, generatedAt }: GrowthPlanPDFProps) {
  const lc = levelColor(engine.scores.level);
  const ll = levelLabel(engine.scores.level);
  const mainBottleneck = engine.bottlenecks[0];

  return (
    <Document
      title={`Growth Planner B2B™ · ${companyName}`}
      author="Growth Planner B2B™"
      subject="Diagnóstico Comercial e Plano de Crescimento"
      creator="Growth Planner B2B™"
    >

      {/* ── PAGE 1: Cover ── */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverTopBar} />
        <View style={S.coverBody}>
          <View>
            <Text style={S.coverLogo}>Growth Planner B2B™</Text>
            <Text style={S.coverTitle}>Plano Estratégico{"\n"}de Crescimento Comercial</Text>
            <Text style={S.coverSubtitle}>{companyName} · Diagnóstico e plano de 90 dias</Text>

            {/* Score box */}
            <View style={S.coverScoreBox}>
              <View>
                <Text style={[S.coverScoreNumber, { color: lc }]}>{engine.scores.overall}</Text>
                <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>/ 100</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[S.badge, { backgroundColor: lc + "22", marginBottom: 8 } as never]}>
                  <Text style={{ color: lc, fontSize: 10, fontFamily: "Helvetica-Bold" }}>
                    {ll} — Growth Score
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: C.mutedLg, lineHeight: 1.5 }}>
                  {engine.maturity.description}
                </Text>
              </View>
            </View>

            {/* Pillar summary */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              {[
                { label: "Demanda",   score: engine.scores.demanda,   color: C.pillars.demanda   },
                { label: "Conversão", score: engine.scores.conversao, color: C.pillars.conversao },
                { label: "Escala",    score: engine.scores.escala,    color: C.pillars.escala    },
              ].map((p) => (
                <View key={p.label} style={[S.card, { flex: 1, alignItems: "center", padding: 12 }]}>
                  <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: p.color }}>{p.score}</Text>
                  <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cover footer */}
          <View>
            <View style={S.hr} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={S.coverMeta}>Gerado em: {generatedAt}</Text>
              <Text style={S.coverMeta}>{email}</Text>
              <Text style={S.coverMeta}>Confidencial</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2: Scores & Maturity ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Scores & Maturidade Comercial" company={companyName} />

        <Text style={S.sectionTitle}>Análise dos 3 Pilares</Text>
        <Text style={{ fontSize: 10, color: C.mutedLg, marginBottom: 20, lineHeight: 1.6 }}>
          O Growth Score é calculado com ponderação: Demanda 40%, Conversão 35%, Escala 25%.
          Cada pilar reflete um conjunto específico de capacidades da operação comercial.
        </Text>

        <View style={{ marginBottom: 24 }}>
          <PillarBar label="Demanda"   score={engine.scores.demanda}   color={C.pillars.demanda}   />
          <PillarBar label="Conversão" score={engine.scores.conversao} color={C.pillars.conversao} />
          <PillarBar label="Escala"    score={engine.scores.escala}    color={C.pillars.escala}    />
        </View>

        <View style={S.hr} />

        {/* Maturity */}
        <Text style={S.sectionTitle}>Perfil de Maturidade</Text>
        <View style={[S.card, { borderColor: lc + "40", borderWidth: 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <View>
              <View style={[S.badge, { backgroundColor: lc + "22", marginBottom: 8 } as never]}>
                <Text style={{ color: lc, fontSize: 10, fontFamily: "Helvetica-Bold" }}>{ll}</Text>
              </View>
              <Text style={{ fontSize: 10, color: C.muted }}>
                Arquétipo: {engine.maturity.archetype.replace(/_/g, " ")}
              </Text>
            </View>
            {engine.maturity.next_level && (
              <Text style={{ fontSize: 9, color: C.muted }}>
                +{engine.maturity.points_to_next} pts para {levelLabel(engine.maturity.next_level)}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 10, color: C.mutedLg, lineHeight: 1.6 }}>
            {engine.maturity.description}
          </Text>
        </View>

        {/* Company profile signals */}
        <View style={S.hr} />
        <Text style={S.sectionSubtitle}>Sinais do Perfil Comercial</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: "ICP Definido",    ok: engine.company_profile.has_icp          },
            { label: "CRM Ativo",       ok: engine.company_profile.uses_crm         },
            { label: "Metas Definidas", ok: engine.company_profile.has_goals        },
            { label: "Métricas CAC/LTV",ok: engine.company_profile.knows_cac_ltv   },
            { label: "Processo Vendas", ok: engine.company_profile.has_sales_process},
            { label: "Prospecção Ativa",ok: !["nunca",""].includes(engine.company_profile.outbound_frequency) },
          ].map((sig) => (
            <View key={sig.label} style={[S.badge, {
              backgroundColor: (sig.ok ? C.emerald : C.red) + "15",
              borderWidth: 1, borderColor: (sig.ok ? C.emerald : C.red) + "30",
            } as never]}>
              <Text style={{ color: sig.ok ? C.emerald : C.red, fontSize: 9 }}>
                {sig.ok ? "✓" : "✗"} {sig.label}
              </Text>
            </View>
          ))}
        </View>

        <PageFooter page={2} total={TOTAL_PAGES} />
      </Page>

      {/* ── PAGE 3: Funnel Analysis ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Análise do Funil Comercial" company={companyName} />

        <Text style={S.sectionTitle}>Funil Atual vs. Benchmark B2B</Text>
        <Text style={{ fontSize: 10, color: C.mutedLg, marginBottom: 16, lineHeight: 1.6 }}>
          Volumes mensais estimados com base nas respostas do diagnóstico,
          comparados com benchmarks do setor B2B brasileiro.
        </Text>

        {/* Stage table */}
        <View style={{ marginBottom: 16 }}>
          {engine.funnel_analysis.stages.map((stage, i) => {
            const hc = { healthy: C.emerald, warning: C.amber, critical: C.red }[stage.health];
            return (
              <View key={stage.id} style={[S.funnelStage, { backgroundColor: hc + "0a", borderColor: hc + "25" }]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hc, marginRight: 8 }} />
                <Text style={S.funnelLabel}>{stage.label}</Text>
                <Text style={[S.funnelVol, { color: hc }]}>{stage.estimated_monthly.toLocaleString("pt-BR")}</Text>
                {i < engine.funnel_analysis.stages.length - 1 && (
                  <Text style={S.funnelConv}>→ {stage.conversion_to_next.toFixed(0)}%</Text>
                )}
                <Text style={[S.funnelConv, { color: stage.gap_vs_benchmark < 0 ? C.red : C.emerald }]}>
                  {stage.gap_vs_benchmark >= 0 ? "+" : ""}{stage.gap_vs_benchmark.toFixed(0)}% vs bench
                </Text>
              </View>
            );
          })}
        </View>

        {/* Lost revenue */}
        <View style={[S.card, { backgroundColor: C.red + "0a", borderColor: C.red + "25" }]}>
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.red, marginBottom: 4 }}>
            Receita Potencial Perdida no Funil
          </Text>
          <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: C.red }}>
            ~{engine.funnel_analysis.estimated_lost_revenue_pct}%
          </Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
            Estimativa baseada nas taxas de conversão vs. benchmark B2B
          </Text>
        </View>

        <View style={S.hr} />
        <Text style={S.sectionSubtitle}>Principal Vazamento</Text>
        <View style={S.card}>
          <Text style={{ fontSize: 10, color: C.text }}>
            O maior gap vs. benchmark está no estágio{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: C.brand }}>
              {engine.funnel_analysis.main_leak}
            </Text>
            . Corrigir este ponto tem o maior potencial de impacto na receita.
          </Text>
        </View>

        <PageFooter page={3} total={TOTAL_PAGES} />
      </Page>

      {/* ── PAGE 4: Bottlenecks ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Gargalos Comerciais" company={companyName} />

        <Text style={S.sectionTitle}>Análise de Gargalos por Pilar</Text>

        {engine.bottlenecks.map((b, i) => {
          const sc = { critical: C.red, moderate: C.amber, mild: C.emerald }[b.severity];
          return (
            <View key={b.type} style={[S.bottleneckCard, { backgroundColor: sc + "08", borderColor: sc + "28" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {i === 0 && (
                    <View style={[S.badge, { backgroundColor: sc + "22" } as never]}>
                      <Text style={{ color: sc, fontSize: 8, fontFamily: "Helvetica-Bold" }}>PRINCIPAL</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white }}>
                    {b.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: sc }}>
                  {b.score}/100
                </Text>
              </View>

              <Text style={{ fontSize: 10, color: C.mutedLg, lineHeight: 1.6, marginBottom: 10 }}>
                {b.description}
              </Text>

              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                IMPACTO NO NEGÓCIO
              </Text>
              <Text style={{ fontSize: 9, color: C.mutedLg, lineHeight: 1.5, marginBottom: 10 }}>
                {b.business_impact}
              </Text>

              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                QUICK WINS
              </Text>
              {b.quick_wins.slice(0, 3).map((w, wi) => (
                <View key={wi} style={S.quickWin}>
                  <Text style={S.quickWinBullet}>⚡</Text>
                  <Text style={S.quickWinText}>{w}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <PageFooter page={4} total={TOTAL_PAGES} />
      </Page>

      {/* ── PAGE 5: Executive Diagnosis ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Diagnóstico Executivo" company={companyName} />

        <Text style={S.sectionTitle}>Diagnóstico da IA Consultiva</Text>
        <Text style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>
          Análise gerada por IA com base nos dados do Score Engine · {generatedAt}
        </Text>

        {/* Split diagnostico into paragraphs */}
        {plan.diagnostico.split("\n").filter(Boolean).map((para, i) => (
          <View key={i} style={S.diagParagraph}>
            <Text style={{ fontSize: 10, color: C.mutedLg, lineHeight: 1.7 }}>{para}</Text>
          </View>
        ))}

        <View style={S.hr} />
        <Text style={S.sectionSubtitle}>Top 3 Prioridades</Text>
        {engine.priorities.slice(0, 3).map((p, i) => (
          <View key={i} style={[S.card, { borderLeftWidth: 3, borderLeftColor: pillarColor(p.pillar) }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white, flex: 1 }}>
                {i + 1}. {p.title}
              </Text>
              <Text style={{ fontSize: 8, color: C.muted }}>{p.time_horizon}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.mutedLg, lineHeight: 1.5, marginBottom: 6 }}>{p.description}</Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {p.kpis.slice(0, 2).map((kpi, k) => (
                <View key={k} style={S.kpiTag}><Text>📊 {kpi}</Text></View>
              ))}
            </View>
          </View>
        ))}

        <PageFooter page={5} total={TOTAL_PAGES} />
      </Page>

      {/* ── PAGE 6: Plan 30/60/90 ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Plano de Crescimento 90 dias" company={companyName} />

        {/* 30 days */}
        <Text style={S.sectionSubtitle}>Primeiros 30 dias — Fundação & Quick Wins</Text>
        {plan.plano30dias.slice(0, 3).map((item, i) => (
          <ActionCard key={i} item={item} index={i} accentColor={C.brand} />
        ))}

        <View style={S.hr} />

        {/* 60 days */}
        <Text style={S.sectionSubtitle}>30 a 60 dias — Estruturação</Text>
        {plan.plano60dias.slice(0, 3).map((item, i) => (
          <ActionCard key={i} item={item} index={i} accentColor={C.emerald} />
        ))}

        <View style={S.hr} />

        {/* 90 days */}
        <Text style={S.sectionSubtitle}>60 a 90 dias — Aceleração</Text>
        {plan.plano90dias.slice(0, 3).map((item, i) => (
          <ActionCard key={i} item={item} index={i} accentColor={C.violet} />
        ))}

        <PageFooter page={6} total={TOTAL_PAGES} />
      </Page>

      {/* ── PAGE 7: Content + Recommendations ── */}
      <Page size="A4" style={S.contentPage}>
        <PageHeader section="Conteúdos & Recomendações" company={companyName} />

        <Text style={S.sectionSubtitle}>Ideias de Conteúdo B2B</Text>
        <View style={S.twoCol}>
          {plan.conteudos.slice(0, 4).map((c, i) => (
            <View key={i} style={[S.col, S.card]}>
              <Text style={S.cardTitle}>{c.titulo}</Text>
              <Text style={S.cardBody}>{c.formato} · {c.canal}</Text>
              <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{c.objetivo}</Text>
            </View>
          ))}
        </View>

        <View style={S.hr} />
        <Text style={S.sectionSubtitle}>Materiais Ricos Sugeridos</Text>
        {plan.materiaisRicos.map((m, i) => (
          <View key={i} style={[S.card, { flexDirection: "row", gap: 12, alignItems: "flex-start" }]}>
            <View style={{ flex: 1 }}>
              <Text style={S.cardTitle}>{m.titulo}</Text>
              <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{m.tipo} · Funil: {m.etapa_funil}</Text>
              <Text style={S.cardBody}>{m.descricao}</Text>
            </View>
          </View>
        ))}

        <View style={S.hr} />
        <View style={[S.card, { backgroundColor: C.brand + "0d", borderColor: C.brand + "30" }]}>
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.brandLt, marginBottom: 8 }}>
            Próximo Passo Recomendado
          </Text>
          <Text style={{ fontSize: 10, color: C.mutedLg, lineHeight: 1.6 }}>
            Compartilhe este relatório com o time comercial e agende uma reunião de planejamento
            para alinhar as prioridades dos primeiros 30 dias. Foque primeiro no gargalo principal:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: C.text }}>
              {mainBottleneck?.type ?? "demanda"}
            </Text>.
          </Text>
        </View>

        <View style={[S.hr, { marginTop: "auto" }]} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: C.muted }}>Growth Planner B2B™ · growthplanner.com.br</Text>
          <Text style={{ fontSize: 8, color: C.muted }}>Documento confidencial · {generatedAt}</Text>
          <Text style={{ fontSize: 8, color: C.muted }}>{TOTAL_PAGES} / {TOTAL_PAGES}</Text>
        </View>
      </Page>

    </Document>
  );
}
