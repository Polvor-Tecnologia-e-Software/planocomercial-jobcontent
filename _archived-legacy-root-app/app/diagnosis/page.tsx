"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import { WizardProgress } from "@/components/diagnosis/WizardProgress";
import { ModuleIntro } from "@/components/diagnosis/ModuleIntro";
import { QuestionCard } from "@/components/diagnosis/QuestionCard";
import { WizardNav } from "@/components/diagnosis/WizardNav";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import { TrendingUp } from "lucide-react";

type WizardStep = "intro" | "question";

const BG = "hsl(222 47% 6%)";
const MUTED = "hsl(215 20% 45%)";

export default function DiagnosisPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("intro");
  const [mounted, setMounted] = useState(false);

  const {
    company, email,
    currentQuestion, currentAnswer,
    currentIndex, direction,
    isComplete, total, progressPercent,
    currentModuleIndex, isFirstOfModule,
    moduleProgress, MODULE_ORDER,
    setIdentity, answer, goNext, goBack,
    getAnswersArray,
  } = useDiagnosis();

  // Load identity from sessionStorage
  useEffect(() => {
    const c = sessionStorage.getItem("gp_company");
    const e = sessionStorage.getItem("gp_email");
    if (!c || !e) {
      router.replace("/onboarding");
      return;
    }
    setIdentity(c, e);
    setMounted(true);
  }, [router, setIdentity]);

  // Navigate to results when complete
  useEffect(() => {
    if (!isComplete) return;
    const answers = getAnswersArray();
    sessionStorage.setItem("gp_answers", JSON.stringify(answers));
    router.push("/results");
  }, [isComplete, getAnswersArray, router]);

  // Show module intro when entering a new module
  useEffect(() => {
    if (mounted && isFirstOfModule) {
      setStep("intro");
    }
  }, [currentIndex, isFirstOfModule, mounted]);

  const handleIntroComplete = useCallback(() => {
    setStep("question");
  }, []);

  const handleAnswer = useCallback(
    (value: string, score: number) => {
      answer(currentQuestion.id, value, score);
    },
    [answer, currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (!currentAnswer) return;
    goNext();
    // If NOT first of next module, go straight to question
    setStep("question");
  }, [currentAnswer, goNext]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      router.push("/onboarding");
      return;
    }
    goBack();
    setStep("question");
  }, [currentIndex, goBack, router]);

  // keyboard shortcut: Enter = next if answered
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && step === "question" && currentAnswer) {
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, currentAnswer, handleNext]);

  if (!mounted || !currentQuestion) return null;

  // Module question count
  const moduleQuestions = DIAGNOSTIC_QUESTIONS.filter(
    (q) => q.module === currentQuestion.module
  );
  const questionIndexInModule =
    moduleQuestions.findIndex((q) => q.id === currentQuestion.id) + 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ambient background */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
        }}
      >
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, borderRadius: "50%", background: "rgba(14,165,233,0.06)", filter: "blur(80px)" }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          padding: "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,14,23,0.85)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp style={{ width: 14, height: 14, color: "white" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>
              Growth Planner <span style={{ color: "#38bdf8" }}>B2B</span>
            </span>
          </a>

          {/* Progress — fills remaining space */}
          <div style={{ flex: 1 }}>
            <WizardProgress
              currentIndex={currentIndex}
              total={total}
              progressPercent={progressPercent}
              moduleProgress={moduleProgress}
              company={company}
            />
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          {step === "intro" ? (
            <ModuleIntro
              key={`intro-${currentQuestion.module}`}
              module={currentQuestion.module}
              questionCount={moduleQuestions.length}
              onContinue={handleIntroComplete}
            />
          ) : (
            /* Question + nav wrapped together */
            <motion.div
              key="question-wrapper"
              style={{ width: "100%", maxWidth: 600 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  selectedValue={currentAnswer?.value as string | undefined}
                  onSelect={handleAnswer}
                  direction={direction}
                  questionNumber={questionIndexInModule}
                  totalInModule={moduleQuestions.length}
                />
              </AnimatePresence>

              <WizardNav
                canGoBack={true}
                canGoNext={!!currentAnswer}
                isLastQuestion={currentIndex === total - 1}
                hasAnswer={!!currentAnswer}
                onBack={handleBack}
                onNext={handleNext}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer hint ────────────────────────────────────────────────── */}
      <footer style={{ padding: "12px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ fontSize: 11, color: MUTED }}>
          Pressione{" "}
          <kbd style={{ padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, fontFamily: "monospace", background: "rgba(255,255,255,0.04)" }}>
            Enter
          </kbd>{" "}
          para avançar · Seus dados são salvos automaticamente
        </p>
      </footer>
    </div>
  );
}
