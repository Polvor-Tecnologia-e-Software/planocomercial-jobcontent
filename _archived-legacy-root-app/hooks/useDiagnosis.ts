"use client";

import { useState, useCallback, useMemo } from "react";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import type { DiagnosticAnswer, DiagnosticModule } from "@/types";

export interface DiagnosisState {
  company: string;
  email: string;
  answers: Record<string, DiagnosticAnswer>;
  currentIndex: number;
  direction: "forward" | "backward";
  isComplete: boolean;
}

export function useDiagnosis() {
  const questions = DIAGNOSTIC_QUESTIONS;
  const total = questions.length;

  const [state, setState] = useState<DiagnosisState>({
    company: "",
    email: "",
    answers: {},
    currentIndex: 0,
    direction: "forward",
    isComplete: false,
  });

  const currentQuestion = questions[state.currentIndex];
  const currentAnswer = state.answers[currentQuestion?.id];
  const progressPercent = Math.round((state.currentIndex / total) * 100);
  const answeredCount = Object.keys(state.answers).length;

  // Which module index (0-5) is the current question in?
  const MODULE_ORDER: DiagnosticModule[] = [
    "momento_atual",
    "meta_comercial",
    "demanda",
    "conversao",
    "processo_escala",
    "inteligencia_mercado",
  ];

  const currentModuleIndex = MODULE_ORDER.indexOf(currentQuestion?.module);

  // First question index of each module
  const moduleStartIndexes = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q, i) => {
      if (map[q.module] === undefined) map[q.module] = i;
    });
    return map;
  }, [questions]);

  const isFirstOfModule =
    moduleStartIndexes[currentQuestion?.module] === state.currentIndex;

  const setIdentity = useCallback((company: string, email: string) => {
    setState((s) => ({ ...s, company, email }));
  }, []);

  const answer = useCallback(
    (questionId: string, value: string, score: number) => {
      setState((s) => ({
        ...s,
        answers: {
          ...s.answers,
          [questionId]: { question_id: questionId, value, score },
        },
      }));
    },
    []
  );

  const goNext = useCallback(() => {
    setState((s) => {
      if (s.currentIndex >= total - 1) {
        return { ...s, direction: "forward", isComplete: true };
      }
      return {
        ...s,
        currentIndex: s.currentIndex + 1,
        direction: "forward",
      };
    });
  }, [total]);

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.currentIndex <= 0) return s;
      return {
        ...s,
        currentIndex: s.currentIndex - 1,
        direction: "backward",
      };
    });
  }, []);

  const getAnswersArray = useCallback((): DiagnosticAnswer[] => {
    return Object.values(state.answers);
  }, [state.answers]);

  // Grouped by module for the sidebar
  const moduleProgress = useMemo(() => {
    return MODULE_ORDER.map((mod) => {
      const modQuestions = questions.filter((q) => q.module === mod);
      const answered = modQuestions.filter((q) => state.answers[q.id]).length;
      return {
        module: mod,
        total: modQuestions.length,
        answered,
        isActive: currentQuestion?.module === mod,
        isComplete: answered === modQuestions.length,
      };
    });
  }, [questions, state.answers, currentQuestion, MODULE_ORDER]);

  return {
    // state
    company: state.company,
    email: state.email,
    currentQuestion,
    currentAnswer,
    currentIndex: state.currentIndex,
    direction: state.direction,
    isComplete: state.isComplete,
    total,
    progressPercent,
    answeredCount,
    currentModuleIndex,
    isFirstOfModule,
    moduleProgress,
    MODULE_ORDER,
    // actions
    setIdentity,
    answer,
    goNext,
    goBack,
    getAnswersArray,
  };
}
