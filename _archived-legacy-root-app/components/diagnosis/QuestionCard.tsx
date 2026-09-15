"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DiagnosticQuestion, DiagnosticOption } from "@/types";

interface QuestionCardProps {
  question: DiagnosticQuestion;
  selectedValue: string | undefined;
  onSelect: (value: string, score: number) => void;
  direction: "forward" | "backward";
  questionNumber: number;
  totalInModule: number;
}

const MODULE_COLORS: Record<string, { accent: string; bg: string; label: string }> = {
  momento_atual:        { accent: "#38bdf8", bg: "rgba(14,165,233,0.08)",  label: "Momento Atual" },
  meta_comercial:       { accent: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "Meta Comercial" },
  demanda:              { accent: "#34d399", bg: "rgba(52,211,153,0.08)",  label: "Geração de Demanda" },
  conversao:            { accent: "#fbbf24", bg: "rgba(251,191,36,0.08)",  label: "Conversão" },
  processo_escala:      { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",  label: "Processo & Escala" },
  inteligencia_mercado: { accent: "#f472b6", bg: "rgba(244,114,182,0.08)", label: "Inteligência de Mercado" },
};

const PILLAR_LABELS: Record<string, string> = {
  demanda: "Demanda",
  conversao: "Conversão",
  escala: "Escala",
};

export function QuestionCard({
  question,
  selectedValue,
  onSelect,
  direction,
  questionNumber,
  totalInModule,
}: QuestionCardProps) {
  const mc = MODULE_COLORS[question.module] ?? MODULE_COLORS.momento_atual;

  const variants = {
    enter: {
      opacity: 0,
      x: direction === "forward" ? 40 : -40,
    },
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.38, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      x: direction === "forward" ? -40 : 40,
      transition: { duration: 0.25, ease: "easeIn" as const },
    },
  };

  return (
    <motion.div
      key={question.id}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ width: "100%", maxWidth: 600 }}
    >
      {/* Module badge */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: mc.bg,
            border: `1px solid ${mc.accent}25`,
            color: mc.accent,
          }}
        >
          {mc.label}
        </span>
        <span style={{ fontSize: 11, color: "hsl(215 20% 40%)" }}>
          {questionNumber}/{totalInModule} neste módulo
        </span>
      </div>

      {/* Pillar tag + weight */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "hsl(215 20% 45%)",
            padding: "2px 8px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          Pilar: {PILLAR_LABELS[question.pillar]}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "hsl(215 20% 40%)",
          }}
        >
          Peso {question.weight}/3
        </span>
      </div>

      {/* Question text */}
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(19px, 3vw, 24px)",
          fontWeight: 700,
          lineHeight: 1.35,
          marginBottom: question.description ? 10 : 28,
          letterSpacing: "-0.01em",
        }}
      >
        {question.text}
      </h2>

      {/* Description */}
      {question.description && (
        <p
          style={{
            fontSize: 14,
            color: "hsl(215 20% 55%)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          {question.description}
        </p>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options?.map((opt, i) => (
          <OptionCard
            key={opt.value}
            option={opt}
            isSelected={selectedValue === opt.value}
            onSelect={() => onSelect(opt.value, opt.score)}
            delay={i * 0.05}
            accentColor={mc.accent}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── OptionCard ────────────────────────────────────────────────────────────────

interface OptionCardProps {
  option: DiagnosticOption;
  isSelected: boolean;
  onSelect: () => void;
  delay: number;
  accentColor: string;
}

function OptionCard({ option, isSelected, onSelect, delay, accentColor }: OptionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" as const }}
      className={`option-card${isSelected ? " selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-pressed={isSelected}
      style={
        isSelected
          ? {
              borderColor: accentColor,
              background: `${accentColor}14`,
              boxShadow: `0 0 0 1px ${accentColor}30, 0 4px 20px ${accentColor}12`,
            }
          : {}
      }
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Radio indicator */}
        <div
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: `2px solid ${isSelected ? accentColor : "rgba(255,255,255,0.2)"}`,
            background: isSelected ? accentColor : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
            transition: "all 0.2s",
          }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "white",
              }}
            />
          )}
        </div>

        {/* Label content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {option.icon && (
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                {option.icon}
              </span>
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                lineHeight: 1.5,
                color: isSelected ? "white" : "hsl(210 40% 88%)",
                transition: "color 0.2s, font-weight 0.2s",
              }}
            >
              {option.label}
            </span>
          </div>
        </div>

        {/* Score indicator (subtle) */}
        <div
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: isSelected ? accentColor : "hsl(215 20% 35%)",
            transition: "color 0.2s",
            marginTop: 2,
          }}
        >
          +{option.score}
        </div>
      </div>
    </motion.div>
  );
}
