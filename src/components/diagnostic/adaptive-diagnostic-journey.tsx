"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  computeProgress,
  findNextQuestion,
  getApplicableRoute,
  toAnswerMap,
  type AnswerMap,
  type RouteQuestion,
} from "@/lib/challenges/adaptive-engine";
import type { AdaptiveChallengeQuestion, ChallengeQuestion } from "@/lib/challenges/challenge-config";
import { cn } from "@/lib/utils";
import { answerDiagnosticQuestionAction } from "@/server/actions/answer-diagnostic-question-action";
import type { AnswerDiagnosticQuestionResult } from "@/server/answer-diagnostic-question";
import type { DiagnosticAnswerRow, SelectedChallenge } from "@/types/tables";

type AdaptiveDiagnosticJourneyProps = {
  diagnosticId: string;
  challenge: SelectedChallenge;
  initialAnswers: readonly DiagnosticAnswerRow[];
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_value: "Essa resposta não é válida — confira e tente de novo.",
  not_applicable:
    "Essa pergunta não está mais disponível (uma resposta anterior mudou a rota). Recarregando...",
  unknown_question: "Não reconhecemos essa pergunta. Recarregando...",
  challenge_not_selected: "Não encontramos o desafio selecionado. Recarregando...",
  diagnostic_not_found: "Não encontramos seu diagnóstico. Recarregando...",
};

/**
 * Jornada adaptativa (Telas 5+ do BRD): uma pergunta por tela, dentro da
 * mesma página — sem reload entre perguntas. Todo o cálculo de "qual
 * pergunta aparece agora" vem do motor (adaptive-engine); este componente
 * só pergunta a ele e desenha o resultado.
 */
export function AdaptiveDiagnosticJourney({
  diagnosticId,
  challenge,
  initialAnswers,
}: AdaptiveDiagnosticJourneyProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<AnswerMap>(() => toAnswerMap(initialAnswers));
  const [currentKey, setCurrentKey] = useState<string | null>(() => {
    const initialAnswerMap = toAnswerMap(initialAnswers);
    const route = getApplicableRoute(challenge, initialAnswerMap);
    return findNextQuestion(route, initialAnswerMap)?.key ?? null;
  });
  const [draftValue, setDraftValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(currentKey === null);

  const route = useMemo(() => getApplicableRoute(challenge, answers), [challenge, answers]);
  const progress = useMemo(() => computeProgress(route, answers), [route, answers]);
  const currentIndex = currentKey ? route.findIndex((item) => item.key === currentKey) : -1;
  const currentItem: RouteQuestion | null = currentIndex >= 0 ? route[currentIndex] : null;
  const canGoBack = currentIndex > 0;

  // Ao trocar de pergunta (avançar, voltar, ou editar), recarrega o
  // rascunho a partir da resposta já salva (se houver) e limpa o erro.
  useEffect(() => {
    if (currentItem) {
      const existing = answers[currentItem.key];
      setDraftValue(existing !== undefined ? String(existing) : "");
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à troca de pergunta, não a toda mudança de answers/route
  }, [currentItem?.key]);

  function goBack() {
    if (canGoBack) setCurrentKey(route[currentIndex - 1].key);
  }

  function handleResult(result: AnswerDiagnosticQuestionResult, questionKey: string) {
    if (result.status === "error") {
      setError(ERROR_MESSAGES[result.reason] ?? "Não foi possível salvar. Tente novamente.");
      // Estados de "a rota mudou por baixo" — a única saída segura é
      // recarregar o estado do servidor, que é sempre a fonte de verdade.
      if (result.reason === "not_applicable" || result.reason === "unknown_question") {
        router.refresh();
      }
      return;
    }

    const nextAnswers: AnswerMap = { ...answers, [questionKey]: result.value };
    setAnswers(nextAnswers);

    const nextRoute = getApplicableRoute(challenge, nextAnswers);
    const next = findNextQuestion(nextRoute, nextAnswers);

    if (next) {
      setCurrentKey(next.key);
    } else {
      setCompleting(true);
      router.refresh();
    }
  }

  function submit(rawValue: unknown) {
    if (!currentItem || isPending) return;
    const questionKey = currentItem.key;
    setError(null);

    startTransition(async () => {
      const result = await answerDiagnosticQuestionAction(diagnosticId, questionKey, rawValue);
      handleResult(result, questionKey);
    });
  }

  if (completing || !currentItem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground text-sm">Perguntas concluídas — preparando a próxima etapa...</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-10 sm:py-16">
      <JourneyProgressBar percent={progress.percent} answered={progress.answeredCount} total={progress.totalCount} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.key}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="text-xl sm:text-2xl">{currentItem.question.prompt}</CardTitle>
              <CardDescription>
                Pergunta {currentIndex + 1} de {progress.totalCount}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <QuestionInput
                question={currentItem.question}
                draftValue={draftValue}
                onDraftChange={setDraftValue}
                onSubmit={submit}
                disabled={isPending}
              />

              {error ? (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={!canGoBack || isPending}
                >
                  Voltar
                </Button>
                {isPending ? (
                  <span className="text-muted-foreground text-xs" aria-live="polite">
                    Salvando...
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Barra de progresso interna da jornada ────────────────────────────────
// Mostra o progresso real desta etapa (respondidas / aplicáveis agora),
// distinto da barra macro do cabeçalho da página (que só marca a
// transição entre grandes etapas do funil).
function JourneyProgressBar({
  percent,
  answered,
  total,
}: {
  percent: number;
  answered: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do diagnóstico"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {answered} de {total} perguntas respondidas
      </p>
    </div>
  );
}

// ─── Entrada por tipo de pergunta ───────────────────────────────────────────
type QuestionInputProps = {
  question: ChallengeQuestion | AdaptiveChallengeQuestion;
  draftValue: string;
  onDraftChange: (value: string) => void;
  onSubmit: (rawValue: unknown) => void;
  disabled: boolean;
};

function QuestionInput({ question, draftValue, onDraftChange, onSubmit, disabled }: QuestionInputProps) {
  if (question.type === "single_select") {
    return (
      <SingleSelectInput
        options={question.options ?? []}
        prompt={question.prompt}
        value={draftValue || null}
        onSelect={onSubmit}
        disabled={disabled}
      />
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draftValue);
      }}
      className="flex flex-col gap-4"
    >
      {question.type === "number" ? (
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={disabled}
          autoFocus
          aria-label={question.prompt}
        />
      ) : question.type === "currency" ? (
        <CurrencyInput
          value={draftValue}
          onChange={onDraftChange}
          disabled={disabled}
          ariaLabel={question.prompt}
        />
      ) : question.type === "date" ? (
        <Input
          type="date"
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={disabled}
          autoFocus
          aria-label={question.prompt}
        />
      ) : (
        <textarea
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={disabled}
          autoFocus
          rows={3}
          maxLength={2000}
          aria-label={question.prompt}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={disabled || draftValue.trim() === ""}>
        Continuar
      </Button>
    </form>
  );
}

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type CurrencyInputProps = {
  /** Dígitos puros representando um valor inteiro em reais (ex.: "5000" para R$ 5.000) — nunca centavos, nunca com símbolo. */
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  ariaLabel: string;
};

/**
 * Campo de moeda formatado (R$ 5.000, com separador de milhar) mantendo
 * o mesmo contrato de valor que o campo "number" (uma string de dígitos
 * em reais — nunca centavos, nunca símbolo) para não exigir nenhuma
 * mudança na validação/persistência server-side além do próprio tipo.
 *
 * A cada tecla, extrai só os dígitos do valor atual do campo (que já vem
 * formatado, com "R$" e pontos de milhar) — funciona tanto para digitar
 * quanto para apagar, sem precisar de biblioteca de máscara.
 */
function CurrencyInput({ value, onChange, disabled, ariaLabel }: CurrencyInputProps) {
  const formatted = value ? BRL_FORMATTER.format(Number(value)) : "";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    onChange(digits);
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={handleChange}
      disabled={disabled}
      autoFocus
      aria-label={ariaLabel}
      placeholder="R$ 0"
    />
  );
}

type SingleSelectInputProps = {
  options: readonly { readonly value: string; readonly label: string }[];
  prompt: string;
  value: string | null;
  onSelect: (value: string) => void;
  disabled: boolean;
};

function SingleSelectInput({ options, prompt, value, onSelect, disabled }: SingleSelectInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(() => {
    const selected = options.findIndex((option) => option.value === value);
    return selected >= 0 ? selected : 0;
  });
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusAt(index: number) {
    const next = (index + options.length) % options.length;
    setFocusedIndex(next);
    optionRefs.current[next]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!disabled) onSelect(options[index].value);
        break;
      default:
        break;
    }
  }

  return (
    <div role="radiogroup" aria-label={prompt} className="flex flex-col gap-3">
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => {
            optionRefs.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          tabIndex={index === focusedIndex ? 0 : -1}
          disabled={disabled}
          onFocus={() => setFocusedIndex(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onClick={() => onSelect(option.value)}
          className={cn(
            "border-border bg-card hover:border-primary/50 flex items-center rounded-lg border px-4 py-3 text-left text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            value === option.value ? "border-primary ring-primary ring-2" : null,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
