import { describe, expect, it } from "vitest";

import {
  computeProgress,
  evaluateDisplayRule,
  findNextQuestion,
  findQuestionInChallenge,
  getApplicableRoute,
  toAnswerMap,
  validateAnswerValue,
  type AnswerMap,
} from "@/lib/challenges/adaptive-engine";
import { CHALLENGE_ORDER, CHALLENGES } from "@/lib/challenges/challenge-config";

describe("evaluateDisplayRule — formato legado (o único usado hoje pelo catálogo)", () => {
  it("whenAnswerIn vazio: verdadeira assim que a pergunta referenciada tiver qualquer resposta", () => {
    const rule = { showAfterKey: "U1", whenAnswerIn: [] } as const;
    expect(evaluateDisplayRule(rule, {})).toBe(false);
    expect(evaluateDisplayRule(rule, { U1: 5000 })).toBe(true);
  });

  it("whenAnswerIn não vazio: só verdadeira se a resposta estiver na lista", () => {
    const rule = { showAfterKey: "D1_Q1", whenAnswerIn: ["nao_sei"] } as const;
    expect(evaluateDisplayRule(rule, { D1_Q1: "outbound" })).toBe(false);
    expect(evaluateDisplayRule(rule, { D1_Q1: "nao_sei" })).toBe(true);
    expect(evaluateDisplayRule(rule, {})).toBe(false);
  });
});

describe("evaluateDisplayRule — operadores novos", () => {
  it("equals", () => {
    const rule = { questionKey: "D2_Q1", operator: "equals", value: "sim" } as const;
    expect(evaluateDisplayRule(rule, { D2_Q1: "sim" })).toBe(true);
    expect(evaluateDisplayRule(rule, { D2_Q1: "nao" })).toBe(false);
    expect(evaluateDisplayRule(rule, {})).toBe(false);
  });

  it("notEquals", () => {
    const rule = { questionKey: "D2_Q1", operator: "notEquals", value: "sim" } as const;
    expect(evaluateDisplayRule(rule, { D2_Q1: "nao" })).toBe(true);
    expect(evaluateDisplayRule(rule, { D2_Q1: "sim" })).toBe(false);
  });

  it("exists / notExists", () => {
    expect(evaluateDisplayRule({ questionKey: "U1", operator: "exists" }, {})).toBe(false);
    expect(evaluateDisplayRule({ questionKey: "U1", operator: "exists" }, { U1: 100 })).toBe(true);
    expect(evaluateDisplayRule({ questionKey: "U1", operator: "notExists" }, {})).toBe(true);
    expect(evaluateDisplayRule({ questionKey: "U1", operator: "notExists" }, { U1: 100 })).toBe(false);
  });

  it("in / notIn", () => {
    const inRule = { questionKey: "D1_Q1", operator: "in", value: ["a", "b"] } as const;
    expect(evaluateDisplayRule(inRule, { D1_Q1: "a" })).toBe(true);
    expect(evaluateDisplayRule(inRule, { D1_Q1: "c" })).toBe(false);

    const notInRule = { questionKey: "D1_Q1", operator: "notIn", value: ["a", "b"] } as const;
    expect(evaluateDisplayRule(notInRule, { D1_Q1: "c" })).toBe(true);
    expect(evaluateDisplayRule(notInRule, { D1_Q1: "a" })).toBe(false);
  });

  it("greaterThan / greaterThanOrEqual / lessThan / lessThanOrEqual", () => {
    expect(
      evaluateDisplayRule({ questionKey: "D1_Q2", operator: "greaterThan", value: 50 }, { D1_Q2: 51 }),
    ).toBe(true);
    expect(
      evaluateDisplayRule({ questionKey: "D1_Q2", operator: "greaterThan", value: 50 }, { D1_Q2: 50 }),
    ).toBe(false);
    expect(
      evaluateDisplayRule(
        { questionKey: "D1_Q2", operator: "greaterThanOrEqual", value: 50 },
        { D1_Q2: 50 },
      ),
    ).toBe(true);
    expect(
      evaluateDisplayRule({ questionKey: "D1_Q2", operator: "lessThan", value: 50 }, { D1_Q2: 49 }),
    ).toBe(true);
    expect(
      evaluateDisplayRule({ questionKey: "D1_Q2", operator: "lessThanOrEqual", value: 50 }, { D1_Q2: 50 }),
    ).toBe(true);
  });

  it("condição composta: AND", () => {
    const rule = {
      and: [
        { questionKey: "U1", operator: "exists" },
        { questionKey: "D1_Q1", operator: "equals", value: "nao_sei" },
      ],
    } as const;
    expect(evaluateDisplayRule(rule, { U1: 1000 })).toBe(false);
    expect(evaluateDisplayRule(rule, { U1: 1000, D1_Q1: "nao_sei" })).toBe(true);
  });

  it("condição composta: OR", () => {
    const rule = {
      or: [
        { questionKey: "D1_Q1", operator: "equals", value: "outbound" },
        { questionKey: "D1_Q1", operator: "equals", value: "inbound" },
      ],
    } as const;
    expect(evaluateDisplayRule(rule, { D1_Q1: "outbound" })).toBe(true);
    expect(evaluateDisplayRule(rule, { D1_Q1: "inbound" })).toBe(true);
    expect(evaluateDisplayRule(rule, { D1_Q1: "eventos" })).toBe(false);
  });
});

describe("getApplicableRoute", () => {
  it("perguntas universais (sem displayRule) estão sempre aplicáveis, mesmo sem nenhuma resposta", () => {
    const route = getApplicableRoute("D1", {});
    for (const key of CHALLENGES.D1.universalQuestions.map((q) => q.key)) {
      expect(route.some((item) => item.key === key)).toBe(true);
    }
  });

  it("pergunta adaptativa aparece só depois que a pergunta de gatilho é respondida", () => {
    expect(getApplicableRoute("D1", {}).some((item) => item.key === "D1_Q1")).toBe(false);
    expect(
      getApplicableRoute("D1", { U1: 5000, U2: 30, U3: 2 }).some((item) => item.key === "D1_Q1"),
    ).toBe(true);
  });

  it("pergunta condicional (whenAnswerIn) só aparece com a resposta que a habilita", () => {
    const base: AnswerMap = { U1: 1, U2: 1, U3: 1, D1_Q1: "outbound" };
    expect(getApplicableRoute("D1", base).some((item) => item.key === "D1_Q3")).toBe(false);
    expect(
      getApplicableRoute("D1", { ...base, D1_Q1: "nao_sei" }).some((item) => item.key === "D1_Q3"),
    ).toBe(true);
  });

  it("pergunta desaparece da rota depois que a resposta que a habilitava é alterada", () => {
    const withTrigger: AnswerMap = { U1: 1, U2: 1, U3: 1, D1_Q1: "nao_sei" };
    expect(getApplicableRoute("D1", withTrigger).some((item) => item.key === "D1_Q3")).toBe(true);

    const changed: AnswerMap = { ...withTrigger, D1_Q1: "outbound" };
    expect(getApplicableRoute("D1", changed).some((item) => item.key === "D1_Q3")).toBe(false);
  });

  it.each(CHALLENGE_ORDER)("produz uma rota não vazia para o desafio %s", (challenge) => {
    const route = getApplicableRoute(challenge, {});
    expect(route.length).toBeGreaterThan(0);
    expect(route.every((item) => !item.adaptive)).toBe(true);
  });
});

describe("computeProgress", () => {
  it("0 de N quando nada foi respondido", () => {
    const route = getApplicableRoute("D5", {});
    const progress = computeProgress(route, {});
    expect(progress.answeredCount).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.totalCount).toBe(route.length);
  });

  it("progresso usa o total de perguntas aplicáveis AGORA, não o catálogo bruto do desafio", () => {
    const answers: AnswerMap = { U1: 1000, U2: 30, U3: 2 };
    const route = getApplicableRoute("D1", answers);
    const progress = computeProgress(route, answers);

    const totalBrutoDoCatalogo =
      CHALLENGES.D1.universalQuestions.length + CHALLENGES.D1.adaptiveQuestions.length;

    expect(progress.answeredCount).toBe(3);
    expect(progress.totalCount).toBe(route.length);
    expect(progress.totalCount).toBeLessThan(totalBrutoDoCatalogo);
    expect(progress.percent).toBe(Math.round((3 / route.length) * 100));
  });
});

describe("findNextQuestion", () => {
  it("retorna a primeira pergunta aplicável ainda sem resposta", () => {
    const answers: AnswerMap = { U1: 1000 };
    const route = getApplicableRoute("D1", answers);
    expect(findNextQuestion(route, answers)?.key).toBe("U2");
  });

  it("retorna null quando tudo que é aplicável já foi respondido — inclusive quando uma pergunta condicional nunca chega a aparecer", () => {
    const answers: AnswerMap = {
      U1: 1000,
      U2: 30,
      U3: 2,
      U4: 100_000,
      U5: 12,
      U6: 50,
      U7: 20,
      U8: 15,
      U9: 10,
      D5_Q1: "sim_atualizado", // D5_Q3 só aparece com "existe_desatualizado"/"nao" — nunca aqui
      D5_Q2: "qualquer_um",
    };
    const route = getApplicableRoute("D5", answers);
    expect(route.some((item) => item.key === "D5_Q3")).toBe(false);
    expect(findNextQuestion(route, answers)).toBeNull();
  });
});

describe("validateAnswerValue", () => {
  const singleSelectQuestion = CHALLENGES.D1.adaptiveQuestions[0]; // D1_Q1
  const currencyQuestion = CHALLENGES.D1.universalQuestions[0]; // U1 (ticket médio)
  const numberQuestion = CHALLENGES.D1.universalQuestions[1]; // U2 (ciclo de vendas, em dias)
  const textQuestion = CHALLENGES.D2.adaptiveQuestions[2]; // D2_Q3
  const dateQuestion = { key: "TESTE_DATA", prompt: "Data de teste", type: "date" as const };

  it("single_select: aceita um valor entre as opções declaradas", () => {
    expect(validateAnswerValue(singleSelectQuestion, "indicacao")).toEqual({
      valid: true,
      value: "indicacao",
    });
  });

  it("single_select: rejeita um valor fora das opções permitidas (payload malicioso/forjado)", () => {
    expect(validateAnswerValue(singleSelectQuestion, "valor-forjado")).toEqual({ valid: false });
    expect(validateAnswerValue(singleSelectQuestion, 123)).toEqual({ valid: false });
  });

  it("number: aceita um número válido, inclusive vindo como string do formulário", () => {
    expect(validateAnswerValue(numberQuestion, "5000")).toEqual({ valid: true, value: 5000 });
    expect(validateAnswerValue(numberQuestion, 42)).toEqual({ valid: true, value: 42 });
  });

  it("number: rejeita valores extremos, negativos ou não numéricos", () => {
    expect(validateAnswerValue(numberQuestion, "abc")).toEqual({ valid: false });
    expect(validateAnswerValue(numberQuestion, -1)).toEqual({ valid: false });
    expect(validateAnswerValue(numberQuestion, Number.POSITIVE_INFINITY)).toEqual({ valid: false });
    expect(validateAnswerValue(numberQuestion, 1_000_000_001)).toEqual({ valid: false });
  });

  it("currency: aceita um número puro em reais (sem símbolo/formatação), mesma regra de 'number'", () => {
    expect(validateAnswerValue(currencyQuestion, "5000")).toEqual({ valid: true, value: 5000 });
    expect(validateAnswerValue(currencyQuestion, 42)).toEqual({ valid: true, value: 42 });
  });

  it("currency: rejeita valores extremos, negativos ou não numéricos", () => {
    expect(validateAnswerValue(currencyQuestion, "abc")).toEqual({ valid: false });
    expect(validateAnswerValue(currencyQuestion, -1)).toEqual({ valid: false });
    expect(validateAnswerValue(currencyQuestion, 1_000_000_001)).toEqual({ valid: false });
  });

  it("date: aceita uma data válida no formato AAAA-MM-DD", () => {
    expect(validateAnswerValue(dateQuestion, "2026-03-15")).toEqual({
      valid: true,
      value: "2026-03-15",
    });
  });

  it("date: rejeita formato errado, data inexistente, ou não-string", () => {
    expect(validateAnswerValue(dateQuestion, "15/03/2026")).toEqual({ valid: false });
    expect(validateAnswerValue(dateQuestion, "2026-02-31")).toEqual({ valid: false });
    expect(validateAnswerValue(dateQuestion, 20260315)).toEqual({ valid: false });
    expect(validateAnswerValue(dateQuestion, "")).toEqual({ valid: false });
  });

  it("text: aceita texto dentro do limite, rejeita vazio ou longo demais", () => {
    expect(validateAnswerValue(textQuestion, "explicação curta")).toEqual({
      valid: true,
      value: "explicação curta",
    });
    expect(validateAnswerValue(textQuestion, "   ")).toEqual({ valid: false });
    expect(validateAnswerValue(textQuestion, "x".repeat(2001))).toEqual({ valid: false });
  });
});

describe("findQuestionInChallenge", () => {
  it("encontra uma pergunta existente do desafio informado", () => {
    expect(findQuestionInChallenge("D1", "D1_Q1")?.key).toBe("D1_Q1");
    expect(findQuestionInChallenge("D1", "U1")?.key).toBe("U1");
  });

  it("retorna null para uma question_key inexistente", () => {
    expect(findQuestionInChallenge("D1", "chave-forjada")).toBeNull();
  });

  it("retorna null para uma pergunta que pertence a outro desafio", () => {
    expect(findQuestionInChallenge("D1", "D2_Q1")).toBeNull();
  });
});

describe("toAnswerMap", () => {
  it("converte linhas de diagnostic_answers num mapa question_key -> valor", () => {
    expect(
      toAnswerMap([
        { question_key: "U1", answer_value: 5000 },
        { question_key: "D1_Q1", answer_value: "outbound" },
      ]),
    ).toEqual({ U1: 5000, D1_Q1: "outbound" });
  });

  it("ignora valores que não são string nem number (defesa contra dado inconsistente no banco)", () => {
    expect(toAnswerMap([{ question_key: "x", answer_value: { nested: true } }])).toEqual({});
    expect(toAnswerMap([{ question_key: "y", answer_value: null }])).toEqual({});
  });
});
