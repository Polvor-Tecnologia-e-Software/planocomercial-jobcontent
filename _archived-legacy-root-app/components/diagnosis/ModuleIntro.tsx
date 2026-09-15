"use client";

import { motion } from "framer-motion";
import type { DiagnosticModule } from "@/types";

interface ModuleIntroProps {
  module: DiagnosticModule;
  questionCount: number;
  onContinue: () => void;
}

const MODULE_DATA: Record<
  DiagnosticModule,
  {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    bg: string;
    tip: string;
  }
> = {
  momento_atual: {
    title: "Momento Atual",
    subtitle: "Módulo 1 de 6",
    description:
      "Vamos entender em que ponto sua operação comercial está hoje. Sem julgamentos — precisamos de honestidade para gerar um diagnóstico preciso.",
    icon: "📍",
    color: "#38bdf8",
    bg: "rgba(14,165,233,0.08)",
    tip: "Responda com base na realidade atual, não no que você gostaria que fosse.",
  },
  meta_comercial: {
    title: "Meta Comercial",
    subtitle: "Módulo 2 de 6",
    description:
      "Empresas que crescem de forma consistente têm metas claras e acompanhamento rigoroso. Vamos mapear como você define e monitora seus objetivos.",
    icon: "🎯",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    tip: "A falta de metas documentadas é um dos principais inibidores de crescimento B2B.",
  },
  demanda: {
    title: "Geração de Demanda",
    subtitle: "Módulo 3 de 6",
    description:
      "Sem demanda consistente, nenhum processo comercial funciona. Aqui avaliamos seus canais, volume e qualidade de leads.",
    icon: "📥",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    tip: "Demanda previsível é o primeiro fundamento de uma máquina comercial saudável.",
  },
  conversao: {
    title: "Conversão",
    subtitle: "Módulo 4 de 6",
    description:
      "Leads chegando mas não convertendo? Vamos analisar seu processo de vendas, taxas de fechamento e material de apoio.",
    icon: "⚡",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    tip: "Uma melhora de 5% na taxa de conversão pode dobrar a receita sem aumentar custos com marketing.",
  },
  processo_escala: {
    title: "Processo & Escala",
    subtitle: "Módulo 5 de 6",
    description:
      "Crescer sem processo é caos. Avaliamos sua infraestrutura comercial: CRM, onboarding e capacidade de replicar o modelo.",
    icon: "⚙️",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    tip: "A máquina comercial precisa funcionar bem sem depender de heróis individuais.",
  },
  inteligencia_mercado: {
    title: "Inteligência de Mercado",
    subtitle: "Módulo 6 de 6",
    description:
      "O último pilar: conhecimento competitivo e métricas financeiras. Quem domina CAC, LTV e posicionamento tem vantagem decisiva.",
    icon: "🧠",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    tip: "Você está quase lá. Essas últimas perguntas refinam muito a precisão do seu diagnóstico.",
  },
};

export function ModuleIntro({ module, questionCount, onContinue }: ModuleIntroProps) {
  const data = MODULE_DATA[module];

  return (
    <motion.div
      key={`intro-${module}`}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -12 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      style={{ width: "100%", maxWidth: 560 }}
    >
      {/* Module badge */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: data.bg,
            border: `1px solid ${data.color}30`,
            color: data.color,
          }}
        >
          {data.subtitle}
        </span>
      </div>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, type: "spring", bounce: 0.4 }}
        style={{
          fontSize: 56,
          textAlign: "center",
          marginBottom: 20,
          lineHeight: 1,
        }}
      >
        {data.icon}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(26px, 4vw, 34px)",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          lineHeight: 1.2,
        }}
      >
        {data.title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          textAlign: "center",
          color: "hsl(215 20% 60%)",
          fontSize: 15,
          lineHeight: 1.7,
          marginBottom: 24,
        }}
      >
        {data.description}
      </motion.p>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        style={{
          borderRadius: 12,
          padding: "12px 16px",
          background: data.bg,
          border: `1px solid ${data.color}20`,
          marginBottom: 32,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{ fontSize: 13, color: "hsl(215 20% 65%)", lineHeight: 1.6, margin: 0 }}>
          {data.tip}
        </p>
      </motion.div>

      {/* Question count + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        <button
          onClick={onContinue}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 32px",
            borderRadius: 12,
            background: `linear-gradient(135deg, #0ea5e9, #0284c7)`,
            color: "white",
            fontWeight: 600,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(14,165,233,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(14,165,233,0.3)";
          }}
        >
          Iniciar módulo
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 12, color: "hsl(215 20% 45%)" }}>
          {questionCount} {questionCount === 1 ? "pergunta" : "perguntas"} neste módulo
        </span>
      </motion.div>
    </motion.div>
  );
}
