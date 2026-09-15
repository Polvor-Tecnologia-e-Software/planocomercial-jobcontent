import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CHALLENGE_ORDER,
  CHALLENGES,
  UNIVERSAL_QUESTIONS,
  getDeterministicQuestionRoute,
} from "@/lib/challenges/challenge-config";
import { isLegacyDisplayRule } from "@/lib/challenges/adaptive-engine";

describe("CHALLENGE_ORDER / CHALLENGES", () => {
  it("tem exatamente os 6 desafios, sem repetição", () => {
    expect(CHALLENGE_ORDER).toHaveLength(6);
    expect(new Set(CHALLENGE_ORDER).size).toBe(6);
  });

  it("cada entrada de CHALLENGE_ORDER existe em CHALLENGES com o code correspondente", () => {
    for (const code of CHALLENGE_ORDER) {
      expect(CHALLENGES[code].code).toBe(code);
    }
  });

  it("todo desafio usa exatamente o conjunto de perguntas universais compartilhado", () => {
    for (const code of CHALLENGE_ORDER) {
      expect(CHALLENGES[code].universalQuestions).toBe(UNIVERSAL_QUESTIONS);
    }
  });

  it("as chaves de pergunta (universais + adaptativas) de cada desafio são únicas entre si", () => {
    for (const code of CHALLENGE_ORDER) {
      const definition = CHALLENGES[code];
      const keys = [
        ...definition.universalQuestions.map((q) => q.key),
        ...definition.adaptiveQuestions.map((q) => q.key),
      ];
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("toda displayRule aponta para uma chave que existe na rota do próprio desafio", () => {
    for (const code of CHALLENGE_ORDER) {
      const definition = CHALLENGES[code];
      const knownKeys = new Set([
        ...definition.universalQuestions.map((q) => q.key),
        ...definition.adaptiveQuestions.map((q) => q.key),
      ]);

      for (const question of definition.adaptiveQuestions) {
        // Todas as regras do catálogo hoje usam o formato legado
        // ({ showAfterKey, whenAnswerIn }) — o motor (adaptive-engine)
        // também aceita condições/grupos mais ricos, mas o catálogo ainda
        // não precisou deles.
        const rule = question.displayRule;
        expect(isLegacyDisplayRule(rule)).toBe(true);
        if (isLegacyDisplayRule(rule)) {
          expect(knownKeys.has(rule.showAfterKey)).toBe(true);
        }
      }
    }
  });

  it("cada sinal relacionado declara sua proveniência (Anexo D confirmado ou rascunho)", () => {
    for (const code of CHALLENGE_ORDER) {
      for (const signal of CHALLENGES[code].relatedSignals) {
        expect(["brd_anexo_d", "draft"]).toContain(signal.provenance);
      }
    }
  });
});

describe("getDeterministicQuestionRoute", () => {
  it("é determinística: mesma entrada sempre produz a mesma rota", () => {
    const first = getDeterministicQuestionRoute("D1");
    const second = getDeterministicQuestionRoute("D1");

    expect(first.map((item) => item.question.key)).toEqual(
      second.map((item) => item.question.key),
    );
  });

  it("coloca as perguntas universais antes das adaptativas, na ordem declarada", () => {
    const route = getDeterministicQuestionRoute("D2");
    const universalCount = UNIVERSAL_QUESTIONS.length;

    expect(route.slice(0, universalCount).every((item) => !item.adaptive)).toBe(true);
    expect(route.slice(universalCount).every((item) => item.adaptive)).toBe(true);
    expect(route.map((item) => item.question.key)).toEqual([
      ...UNIVERSAL_QUESTIONS.map((q) => q.key),
      ...CHALLENGES.D2.adaptiveQuestions.map((q) => q.key),
    ]);
  });

  it("produz uma rota diferente para desafios diferentes", () => {
    const routeD1 = getDeterministicQuestionRoute("D1").map((item) => item.question.key);
    const routeD4 = getDeterministicQuestionRoute("D4").map((item) => item.question.key);

    expect(routeD1).not.toEqual(routeD4);
  });
});

describe("independência de IA", () => {
  it("o arquivo de configuração não referencia nenhum client/SDK de IA", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/challenges/challenge-config.ts"),
      "utf-8",
    );

    expect(source).not.toMatch(/["']openai["']/);
    expect(source).not.toMatch(/analyze-?[Ss]ite/);
  });
});
