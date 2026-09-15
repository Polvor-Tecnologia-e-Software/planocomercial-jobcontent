"use client";

import { motion } from "framer-motion";

interface WizardNavProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  hasAnswer: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function WizardNav({
  canGoBack,
  canGoNext,
  isLastQuestion,
  hasAnswer,
  onBack,
  onNext,
}: WizardNavProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Back */}
      <motion.button
        onClick={onBack}
        disabled={!canGoBack}
        whileTap={{ scale: 0.96 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 10,
          border: "1.5px solid rgba(255,255,255,0.1)",
          background: "transparent",
          color: canGoBack ? "hsl(210 40% 75%)" : "hsl(215 20% 30%)",
          fontSize: 14,
          fontWeight: 500,
          cursor: canGoBack ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          opacity: canGoBack ? 1 : 0.4,
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          if (canGoBack) {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Voltar
      </motion.button>

      {/* Next / Finish */}
      <motion.button
        onClick={onNext}
        disabled={!hasAnswer}
        whileTap={{ scale: hasAnswer ? 0.97 : 1 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          borderRadius: 10,
          border: "none",
          background: hasAnswer
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "rgba(255,255,255,0.06)",
          color: hasAnswer ? "white" : "hsl(215 20% 35%)",
          fontSize: 14,
          fontWeight: 600,
          cursor: hasAnswer ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          boxShadow: hasAnswer ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          if (hasAnswer) {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(14,165,233,0.35)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = hasAnswer ? "0 4px 16px rgba(14,165,233,0.25)" : "none";
        }}
      >
        {isLastQuestion ? "Ver meu diagnóstico" : "Próxima"}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d={isLastQuestion ? "M2 7h10M7 2l5 5-5 5" : "M5 2l5 5-5 5"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </div>
  );
}
