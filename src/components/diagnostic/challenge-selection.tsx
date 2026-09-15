"use client";

import { useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { CHALLENGE_ORDER, CHALLENGES } from "@/lib/challenges/challenge-config";
import { selectChallengeAction } from "@/server/actions/select-challenge-action";
import type { SelectedChallenge } from "@/types/tables";
import { cn } from "@/lib/utils";

type ChallengeSelectionProps = {
  diagnosticId: string;
};

/**
 * Tela 4 (BRD): "Qual problema mais limita seu crescimento hoje?".
 * Selecionar um cartão já dispara a ação (persistir selected_challenge,
 * registrar o evento, seguir para a próxima etapa) — não há um botão
 * "continuar" separado. Segue o padrão de radiogroup do WAI-ARIA:
 * setas movem o foco entre os cartões, Enter/Espaço confirma a escolha.
 */
export function ChallengeSelection({ diagnosticId }: ChallengeSelectionProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedChallenge | null>(null);
  const [isPending, startTransition] = useTransition();
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  function focusCardAt(index: number) {
    const nextIndex = (index + CHALLENGE_ORDER.length) % CHALLENGE_ORDER.length;
    setFocusedIndex(nextIndex);
    cardRefs.current[nextIndex]?.focus();
  }

  function select(code: SelectedChallenge) {
    if (isPending) return;

    setSelected(code);
    const formData = new FormData();
    formData.set("diagnosticId", diagnosticId);
    formData.set("selectedChallenge", code);

    startTransition(async () => {
      await selectChallengeAction(formData);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusCardAt(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusCardAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusCardAt(0);
        break;
      case "End":
        event.preventDefault();
        focusCardAt(CHALLENGE_ORDER.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        select(CHALLENGE_ORDER[index]);
        break;
      default:
        break;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-1 flex-col justify-center gap-6 py-10 sm:py-16"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">
          Qual problema mais limita seu crescimento hoje?
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Escolha a opção que mais se parece com o seu momento atual.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Qual problema mais limita seu crescimento hoje?"
        aria-busy={isPending}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {CHALLENGE_ORDER.map((code, index) => {
          const definition = CHALLENGES[code];
          const Icon = definition.icon;
          const isSelected = selected === code;

          return (
            <Card
              key={code}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={index === focusedIndex ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => {
                setFocusedIndex(index);
                select(code);
              }}
              onFocus={() => setFocusedIndex(index)}
              aria-disabled={isPending}
              className={cn(
                "flex cursor-pointer flex-col gap-3 p-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6",
                isSelected
                  ? "border-primary ring-primary ring-2"
                  : "hover:border-primary/50",
                isPending && !isSelected ? "opacity-50" : null,
              )}
            >
              <Icon aria-hidden="true" className="text-primary h-6 w-6 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold sm:text-base">{definition.title}</p>
                <p className="text-muted-foreground text-sm">{definition.shortExplanation}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
