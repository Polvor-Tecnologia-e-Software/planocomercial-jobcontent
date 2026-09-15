/**
 * Motor de perguntas adaptativas.
 *
 * Funções puras e determinísticas — sem I/O, sem Supabase, sem "server-only"
 * — para poderem rodar tanto no cliente (a UI só pergunta ao motor "quais
 * perguntas estão disponíveis agora") quanto no servidor (que nunca confia
 * no que o cliente diz ser a pergunta atual, e sempre recalcula a partir
 * das respostas persistidas). Nenhuma lógica de negócio deve viver nos
 * componentes React nem nas Server Actions — só aqui.
 *
 * Não usa eval()/Function() em nenhum ponto: DisplayRule é dado
 * estruturado (ver src/lib/challenges/challenge-config.ts), nunca código.
 */
import {
  CHALLENGES,
  getDeterministicQuestionRoute,
  type AdaptiveChallengeQuestion,
  type ChallengeQuestion,
  type DisplayCondition,
  type DisplayRule,
  type DisplayRuleGroup,
  type LegacyDisplayRule,
} from "@/lib/challenges/challenge-config";
import type { SelectedChallenge } from "@/types/tables";

// ─── Respostas em memória ──────────────────────────────────────────────────
// Mapa question_key -> valor já decodificado (string para single_select/
// text, number para number) — o mesmo formato usado tanto no estado do
// cliente quanto no que é lido de volta de diagnostic_answers.answer_value.
export type AnswerMap = Record<string, string | number>;

/** Converte as linhas de diagnostic_answers (ordem de leitura do banco) num AnswerMap. */
export function toAnswerMap(
  rows: readonly { question_key: string; answer_value: unknown }[],
): AnswerMap {
  const map: AnswerMap = {};
  for (const row of rows) {
    if (typeof row.answer_value === "string" || typeof row.answer_value === "number") {
      map[row.question_key] = row.answer_value;
    }
  }
  return map;
}

// ─── Avaliação de DisplayRule ───────────────────────────────────────────────

export function isLegacyDisplayRule(rule: DisplayRule): rule is LegacyDisplayRule {
  return "showAfterKey" in rule;
}

function isDisplayRuleGroup(rule: DisplayRule): rule is DisplayRuleGroup {
  return "and" in rule || "or" in rule;
}

function hasAnyValue(value: string | number | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return Number.isFinite(value);
}

function evaluateCondition(condition: DisplayCondition, answers: AnswerMap): boolean {
  const value = answers[condition.questionKey];

  switch (condition.operator) {
    case "exists":
      return hasAnyValue(value);
    case "notExists":
      return !hasAnyValue(value);
    case "equals":
      return value !== undefined && value === condition.value;
    case "notEquals":
      return value === undefined || value !== condition.value;
    case "in":
      return (
        value !== undefined &&
        Array.isArray(condition.value) &&
        (condition.value as readonly (string | number)[]).includes(value)
      );
    case "notIn":
      return (
        value === undefined ||
        !Array.isArray(condition.value) ||
        !(condition.value as readonly (string | number)[]).includes(value)
      );
    // "includes"/"notIncludes" são para uma resposta de múltiplos valores
    // (ex.: seleção múltipla) armazenada como string separada por vírgula
    // — não há pergunta desse tipo no catálogo hoje, mas o operador fica
    // pronto para quando existir.
    case "includes":
      return (
        typeof value === "string" &&
        typeof condition.value === "string" &&
        value.split(",").includes(condition.value)
      );
    case "notIncludes":
      return (
        typeof value !== "string" ||
        typeof condition.value !== "string" ||
        !value.split(",").includes(condition.value)
      );
    case "greaterThan":
      return typeof value === "number" && typeof condition.value === "number" && value > condition.value;
    case "greaterThanOrEqual":
      return (
        typeof value === "number" && typeof condition.value === "number" && value >= condition.value
      );
    case "lessThan":
      return typeof value === "number" && typeof condition.value === "number" && value < condition.value;
    case "lessThanOrEqual":
      return (
        typeof value === "number" && typeof condition.value === "number" && value <= condition.value
      );
    default:
      return false;
  }
}

/**
 * Avalia uma DisplayRule (legada, condição única, ou grupo AND/OR) contra
 * as respostas já dadas. Pura: mesma regra + mesmas respostas sempre
 * produz o mesmo resultado.
 */
export function evaluateDisplayRule(rule: DisplayRule, answers: AnswerMap): boolean {
  if (isLegacyDisplayRule(rule)) {
    const value = answers[rule.showAfterKey];
    if (rule.whenAnswerIn.length === 0) return hasAnyValue(value);
    return typeof value === "string" && rule.whenAnswerIn.includes(value);
  }

  if (isDisplayRuleGroup(rule)) {
    if ("and" in rule) return rule.and.every((sub) => evaluateDisplayRule(sub, answers));
    return rule.or.some((sub) => evaluateDisplayRule(sub, answers));
  }

  return evaluateCondition(rule, answers);
}

// ─── Rota aplicável (candidata + displayRule) ───────────────────────────────

export type RouteQuestion = {
  readonly key: string;
  readonly question: ChallengeQuestion | AdaptiveChallengeQuestion;
  readonly adaptive: boolean;
};

/**
 * Entre todas as perguntas candidatas de um desafio (getDeterministicQuestionRoute),
 * devolve só as que estão CURRENTEMENTE aplicáveis dado o conjunto de
 * respostas — universais sempre; adaptativas conforme sua displayRule.
 *
 * Determinística: mesmo desafio + mesmas respostas sempre produz a mesma
 * rota. Deve ser recalculada sempre que uma resposta mudar — alterar uma
 * resposta referenciada por uma displayRule pode fazer perguntas
 * seguintes aparecerem ou desaparecerem da rota.
 */
export function getApplicableRoute(
  challenge: SelectedChallenge,
  answers: AnswerMap,
): readonly RouteQuestion[] {
  const candidateRoute = getDeterministicQuestionRoute(challenge);

  return candidateRoute
    .filter(({ question, adaptive }) => {
      if (!adaptive) return true;
      return evaluateDisplayRule((question as AdaptiveChallengeQuestion).displayRule, answers);
    })
    .map(({ question, adaptive }) => ({ key: question.key, question, adaptive }));
}

export function isQuestionAnswered(value: string | number | undefined): boolean {
  return hasAnyValue(value);
}

// ─── Progresso ───────────────────────────────────────────────────────────────

export type AdaptiveProgress = {
  readonly answeredCount: number;
  readonly totalCount: number;
  /** 0-100, arredondado. 100 quando não há nenhuma pergunta aplicável (caso degenerado). */
  readonly percent: number;
};

/**
 * Progresso = perguntas respondidas aplicáveis / total de perguntas
 * aplicáveis AGORA — não o total bruto do catálogo, que pode superestimar
 * (perguntas que a rota atual nunca vai mostrar) ou subestimar (perguntas
 * que só aparecem depois de uma resposta ainda não dada) o esforço real
 * restante.
 */
export function computeProgress(
  route: readonly RouteQuestion[],
  answers: AnswerMap,
): AdaptiveProgress {
  const totalCount = route.length;
  const answeredCount = route.filter((item) => isQuestionAnswered(answers[item.key])).length;
  const percent = totalCount === 0 ? 100 : Math.round((answeredCount / totalCount) * 100);
  return { answeredCount, totalCount, percent };
}

/** Primeira pergunta da rota atual ainda sem resposta, ou null se todas estiverem respondidas. */
export function findNextQuestion(
  route: readonly RouteQuestion[],
  answers: AnswerMap,
): RouteQuestion | null {
  return route.find((item) => !isQuestionAnswered(answers[item.key])) ?? null;
}

// ─── Resolução e validação de pergunta (usado na validação server-side) ────

/** Procura uma pergunta (universal ou adaptativa) pela key, dentro do catálogo do desafio informado — nunca aceita a key às cegas. */
export function findQuestionInChallenge(
  challenge: SelectedChallenge,
  questionKey: string,
): RouteQuestion | null {
  if (!(challenge in CHALLENGES)) return null;
  const route = getDeterministicQuestionRoute(challenge);
  const found = route.find((item) => item.question.key === questionKey);
  return found ? { key: found.question.key, question: found.question, adaptive: found.adaptive } : null;
}

const MAX_ANSWER_NUMBER = 100_000_000;
const MAX_ANSWER_TEXT_LENGTH = 2_000;
/** Formato produzido por <input type="date"> (ISO 8601, sem hora) — nunca outro formato de data. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type AnswerValueValidation =
  | { valid: true; value: string | number }
  | { valid: false };

/**
 * Valida um valor de resposta bruto (vindo do cliente, portanto não
 * confiável) contra o tipo e as opções declaradas da pergunta. Nunca
 * confia apenas na validação equivalente do formulário no navegador.
 */
export function validateAnswerValue(
  question: ChallengeQuestion,
  rawValue: unknown,
): AnswerValueValidation {
  switch (question.type) {
    case "single_select": {
      if (typeof rawValue !== "string") return { valid: false };
      const isAllowed = (question.options ?? []).some((option) => option.value === rawValue);
      return isAllowed ? { valid: true, value: rawValue } : { valid: false };
    }

    // "currency" grava o mesmo formato que "number" (um número puro em
    // reais, ex.: 5000 para R$ 5.000) — só a entrada é formatada de forma
    // diferente (ver QuestionInput/CurrencyInput em
    // adaptive-diagnostic-journey.tsx). Nunca grava centavos nem símbolo.
    case "number":
    case "currency": {
      const num = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (!Number.isFinite(num) || num < 0 || num > MAX_ANSWER_NUMBER) return { valid: false };
      return { valid: true, value: num };
    }

    case "date": {
      if (typeof rawValue !== "string" || !ISO_DATE_PATTERN.test(rawValue)) return { valid: false };
      // Garante que é uma data real (ex.: rejeita "2026-02-31"), não só o formato.
      const parsed = new Date(`${rawValue}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== rawValue) {
        return { valid: false };
      }
      return { valid: true, value: rawValue };
    }

    case "text": {
      if (typeof rawValue !== "string") return { valid: false };
      const trimmed = rawValue.trim();
      if (trimmed.length === 0 || trimmed.length > MAX_ANSWER_TEXT_LENGTH) return { valid: false };
      return { valid: true, value: trimmed };
    }

    default:
      return { valid: false };
  }
}
