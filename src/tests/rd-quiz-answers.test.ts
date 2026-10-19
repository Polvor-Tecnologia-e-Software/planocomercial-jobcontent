import { describe, expect, it } from "vitest";

import { CHALLENGE_ORDER, CHALLENGES, UNIVERSAL_QUESTIONS } from "@/lib/challenges/challenge-config";
import { RD_QUIZ_FIELDS } from "@/lib/rd-station/field-map";
import { buildRdQuizAnswers, formatAnswer } from "@/lib/rd-station/quiz-answers";

describe("formatAnswer", () => {
  const byKey = (key: string) => UNIVERSAL_QUESTIONS.find((q) => q.key === key)!;

  it("moeda em R$, número puro e opção pelo rótulo (não pelo código interno)", () => {
    expect(formatAnswer(byKey("U4"), 300000)).toBe("R$ 300.000");
    expect(formatAnswer(byKey("U2"), 45)).toBe("45");
    expect(formatAnswer(byKey("U11"), "nao")).toBe("Não, não usamos");
  });

  it("data em dd/mm/aaaa", () => {
    expect(formatAnswer({ key: "X", prompt: "Data", type: "date" }, "2026-10-19")).toBe("19/10/2026");
  });
});

describe("buildRdQuizAnswers", () => {
  it("todas as perguntas de todos os objetivos têm um campo cf_* próprio, sem nome repetido", () => {
    const keys = new Set<string>();
    for (const question of UNIVERSAL_QUESTIONS) keys.add(question.key);
    for (const challenge of CHALLENGE_ORDER) {
      for (const question of CHALLENGES[challenge].adaptiveQuestions) keys.add(question.key);
    }
    for (const key of keys) {
      expect(RD_QUIZ_FIELDS[key], key).toMatch(/^cf_[a-z0-9_]+$/);
    }
    expect(Object.keys(RD_QUIZ_FIELDS).sort()).toEqual([...keys].sort());
    expect(new Set(Object.values(RD_QUIZ_FIELDS)).size).toBe(Object.values(RD_QUIZ_FIELDS).length);
  });

  it("preenche os campos das universais e do desafio, e lista todas as respostas no texto", () => {
    const result = buildRdQuizAnswers("D4", [
      { question_key: "U3", answer_value: 2 },
      { question_key: "D4_Q1", answer_value: "nao" },
      { question_key: "D4_Q3", answer_value: "Cada vendedor faz do seu jeito" },
    ]);

    expect(result.fields).toEqual({
      cf_vendedores_ativos: "2",
      cf_d4_tem_playbook: "Não existe",
      cf_d4_dificuldade_padronizar: "Cada vendedor faz do seu jeito",
    });
    expect(result.summary.split("\n")[0]).toBe("Desafio escolhido: O processo depende demais dos vendedores");
    expect(result.summary).toContain("Existe um processo comercial documentado (playbook)? — Não existe");
    expect(result.summary).toContain("— Cada vendedor faz do seu jeito");
  });

  it("nunca inclui pergunta não respondida nem resposta de pergunta fora da rota do desafio", () => {
    const result = buildRdQuizAnswers("D1", [
      { question_key: "U1", answer_value: 1000 },
      { question_key: "D2_Q1", answer_value: "sim" },
    ]);
    expect(Object.keys(result.fields)).toEqual(["cf_ticket_medio"]);
    expect(result.summary).not.toContain("critério claro de qualificação");
  });
});
