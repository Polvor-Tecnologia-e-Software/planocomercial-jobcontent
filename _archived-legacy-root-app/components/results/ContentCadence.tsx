"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GrowthPlan, ContentItem, RichMaterialItem, CadenceItem } from "@/services/ai/types";
import { T } from "./tokens";
import { FileText, Mail, MessageSquare, Lightbulb, Download, ChevronDown, ChevronUp } from "lucide-react";

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "conteudos",  label: "Conteúdos",  icon: Lightbulb,      color: T.amberLt  },
  { key: "materiais",  label: "Materiais",  icon: Download,        color: T.violetLt },
  { key: "email",      label: "E-mail",     icon: Mail,            color: T.brandLight },
  { key: "whatsapp",   label: "WhatsApp",   icon: MessageSquare,   color: T.emeraldLt },
] as const;

type TabKey = typeof TABS[number]["key"];

// ─── Content idea card ────────────────────────────────────────────────────────
function ContentCard({ item, i }: { item: ContentItem; i: number }) {
  const channelEmoji: Record<string, string> = {
    LinkedIn: "💼", Blog: "✍️", Instagram: "📸", YouTube: "▶️", Email: "📧", Newsletter: "📰",
  };
  const formatColor: Record<string, string> = {
    post: T.brand, artigo: T.emerald, vídeo: T.red, webinar: T.violet,
    carrossel: T.amber, newsletter: T.pink,
  };
  const fc = formatColor[item.formato.toLowerCase()] ?? T.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      style={{
        padding: "14px 16px", borderRadius: T.rL,
        border: `1px solid ${T.border}`, background: T.bgCard,
        display: "flex", gap: 12, alignItems: "flex-start",
        transition: "border-color 0.2s",
      }}
      whileHover={{ borderColor: T.borderMid } as never}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: `${T.amber}12`, border: `1px solid ${T.amber}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        {channelEmoji[item.canal] ?? "📄"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, marginBottom: 5 }}>{item.titulo}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
            background: `${fc}12`, border: `1px solid ${fc}25`, color: fc,
          }}>
            {item.formato}
          </span>
          <span style={{
            fontSize: 10, padding: "1px 7px", borderRadius: 999,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.muted,
          }}>
            {item.canal}
          </span>
          <span style={{
            fontSize: 10, padding: "1px 7px", borderRadius: 999,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.muted,
          }}>
            {item.objetivo}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Rich material card ───────────────────────────────────────────────────────
function MaterialCard({ item, i }: { item: RichMaterialItem; i: number }) {
  const stageColors: Record<string, string> = { topo: T.brand, meio: T.violet, fundo: T.emerald };
  const sc = stageColors[item.etapa_funil] ?? T.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      style={{
        padding: "16px 18px", borderRadius: T.rL,
        border: `1px solid ${T.border}`, background: T.bgCard,
        display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, flex: 1 }}>{item.titulo}</p>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          padding: "2px 8px", borderRadius: 999, flexShrink: 0,
          background: `${sc}14`, border: `1px solid ${sc}28`, color: sc,
        }}>
          {item.etapa_funil}
        </span>
      </div>
      <p style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{item.tipo}</p>
      <p style={{ fontSize: 12, color: T.mutedLg, lineHeight: 1.65 }}>{item.descricao}</p>
    </motion.div>
  );
}

// ─── Cadence accordion ────────────────────────────────────────────────────────
function CadenceCard({
  cadence, i, type
}: { cadence: CadenceItem; i: number; type: "email" | "whatsapp" }) {
  const [open, setOpen] = useState(i === 0);
  const color = type === "email" ? T.brand : T.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      style={{
        borderRadius: T.rL, border: `1px solid ${T.border}`, background: T.bgCard,
        overflow: "hidden", marginBottom: 10,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", color: "white", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `${color}12`, border: `1px solid ${color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {type === "email"
              ? <Mail style={{ width: 13, height: 13, color }} />
              : <MessageSquare style={{ width: 13, height: 13, color }} />
            }
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>{cadence.nome}</p>
            <p style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
              {cadence.passos.length} passos · Gatilho: {cadence.gatilho}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: T.muted }} />
          : <ChevronDown style={{ width: 14, height: 14, color: T.muted }} />
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
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {cadence.passos.map((step, si) => (
                <div
                  key={si}
                  style={{
                    padding: "10px 16px",
                    borderBottom: si < cadence.passos.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                    display: "flex", gap: 14,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40 }}>
                    <span style={{
                      fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 800,
                      color, padding: "1px 6px", borderRadius: 5,
                      background: `${color}12`, border: `1px solid ${color}25`,
                    }}>
                      D{step.dia}
                    </span>
                    {si < cadence.passos.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: `${color}20`, marginTop: 4, minHeight: 12 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <p style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {step.acao}
                    </p>
                    <p style={{ fontSize: 12, color: T.mutedLg, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {step.mensagem}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ContentCadenceProps {
  plan: GrowthPlan;
}

export function ContentCadence({ plan }: ContentCadenceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("conteudos");
  const activeConfig = TABS.find(t => t.key === activeTab)!;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 18,
        background: T.bgCard, border: `1px solid ${T.border}`,
        borderRadius: T.rL, padding: 4,
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: isActive ? 700 : 500,
                border: `1px solid ${isActive ? tab.color + "40" : "transparent"}`,
                background: isActive ? `${tab.color}12` : "transparent",
                color: isActive ? tab.color : T.muted,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "conteudos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.conteudos.map((c, i) => <ContentCard key={i} item={c} i={i} />)}
            </div>
          )}

          {activeTab === "materiais" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {plan.materiaisRicos.map((m, i) => <MaterialCard key={i} item={m} i={i} />)}
            </div>
          )}

          {activeTab === "email" && (
            <div>
              {plan.cadenciaEmail.map((c, i) => (
                <CadenceCard key={i} cadence={c} i={i} type="email" />
              ))}
            </div>
          )}

          {activeTab === "whatsapp" && (
            <div>
              {plan.cadenciaWhatsapp.map((c, i) => (
                <CadenceCard key={i} cadence={c} i={i} type="whatsapp" />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
