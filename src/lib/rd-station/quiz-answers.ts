import { getApplicableRoute, toAnswerMap } from "@/lib/challenges/adaptive-engine";
import { CHALLENGES, type ChallengeQuestion } from "@/lib/challenges/challenge-config";
import { RD_QUIZ_FIELDS } from "@/lib/rd-station/field-map";
import type { SelectedChallenge } from "@/types/tables";

export type RdQuizAnswers = {
  /** Campo personalizado (cf_*) -> resposta já formatada em texto, só para as perguntas universais respondidas. */
  fields: Record<string, string>;
  /** Todas as respostas, uma por linha, prontas para leitura pelo time comercial. */
  summary: string;
};

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Resposta como a pessoa a viu: rótulo da opção (não o código interno), moeda em R$, data em dd/mm/aaaa. */
export function formatAnswer(question: ChallengeQuestion, value: string | number): string {
  switch (question.type) {
    case "single_select":
      return question.options?.find((option) => option.value === value)?.label ?? String(value);
    case "currency":
      // Espaço comum no lugar do espaço inseparável do Intl — busca/filtro na RD.
      return typeof value === "number" ? BRL.format(value).replace(/ /g, " ") : String(value);
    case "date": {
      const [year, month, day] = String(value).split("-");
      return day && month && year ? `${day}/${month}/${year}` : String(value);
    }
    default:
      return String(value);
  }
}

/**
 * Monta as respostas do quiz para a conversão final da RD. Só as
 * perguntas da rota aplicável e de fato respondidas, na ordem em que
 * foram feitas — nunca inventa uma resposta para pergunta pulada.
 */
export function buildRdQuizAnswers(
  challenge: SelectedChallenge,
  rows: readonly { question_key: string; answer_value: unknown }[],
): RdQuizAnswers {
  const answers = toAnswerMap(rows);
  const fields: Record<string, string> = {};
  const lines: string[] = [`Desafio escolhido: ${CHALLENGES[challenge].title}`];

  for (const { key, question } of getApplicableRoute(challenge, answers)) {
    const value = answers[key];
    if (value === undefined) continue;
    const formatted = formatAnswer(question, value);
    lines.push(`${question.prompt} — ${formatted}`);
    const field = RD_QUIZ_FIELDS[key];
    if (field) fields[field] = formatted;
  }

  return { fields, summary: lines.join("\n") };
}
