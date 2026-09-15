"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generateCommercialPlanAction } from "@/server/actions/generate-commercial-plan-action";

type GeneratePlanTriggerProps = {
  diagnosticId: string;
  label: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_output: "A resposta gerada não passou na validação. Tente novamente.",
  transport_error: "Não conseguimos falar com o serviço de IA agora. Tente novamente em instantes.",
  too_many_attempts: "Esse diagnóstico já atingiu o limite de tentativas de geração. Fale com o suporte.",
  diagnostic_not_found: "Não encontramos este diagnóstico.",
  challenge_not_selected: "Este diagnóstico ainda não tem um desafio selecionado.",
};

/**
 * Único pedaço interativo da tela de resultado: dispara a geração (ou
 * nova tentativa) do plano comercial. Chama a Server Action e espera —
 * pode levar até dezenas de segundos (latência de IA) — depois recarrega
 * a página para o Server Component decidir o próximo estado a partir do
 * banco (nunca confia no resultado da própria chamada como fonte final).
 */
export function GeneratePlanTrigger({ diagnosticId, label }: GeneratePlanTriggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await generateCommercialPlanAction(diagnosticId);
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.reason] ?? "Não foi possível gerar o plano. Tente novamente.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" onClick={handleClick} disabled={isPending} aria-busy={isPending}>
        {isPending ? "Gerando seu plano..." : label}
      </Button>
      {error ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
