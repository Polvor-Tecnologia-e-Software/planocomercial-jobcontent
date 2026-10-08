"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanGenerationProgress } from "@/components/result/plan-generation-progress";
import { formatBrazilianPhone } from "@/lib/validation/phone";
import { generateCommercialPlanAction } from "@/server/actions/generate-commercial-plan-action";
import { saveLeadPhoneAction } from "@/server/actions/save-lead-phone-action";

type PhoneGateProps = {
  diagnosticId: string;
  companyName: string;
  /** true quando o plano ainda não foi gerado — o mesmo clique grava o telefone E dispara a geração. */
  needsGeneration: boolean;
};

/**
 * Etapa que pede o telefone antes de liberar a tela do diagnóstico (pedido
 * explícito, com CTA grande). Um clique só: grava o telefone e, se o plano
 * ainda não existe, já dispara a geração — depois recarrega a página para
 * o Server Component decidir o estado a partir do banco (plano pronto, ou
 * falha recuperável com "Tentar novamente").
 */
export function PhoneGate({ diagnosticId, companyName, needsGeneration }: PhoneGateProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Só depois do telefone salvo — um telefone inválido nunca pisca a tela de progresso.
  const [generating, setGenerating] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    startTransition(async () => {
      const saved = await saveLeadPhoneAction(diagnosticId, phone);
      if (!saved.ok) {
        setFieldError(saved.fieldError ?? null);
        setFormError(saved.formError ?? null);
        return;
      }
      if (needsGeneration) {
        setGenerating(true);
        // O resultado não é tratado aqui de propósito: depois do refresh,
        // a página mostra o plano pronto ou o estado de falha com "Tentar
        // novamente" — o telefone já está salvo nos dois casos.
        await generateCommercialPlanAction(diagnosticId);
      }
      router.refresh();
    });
  }

  if (generating) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10 sm:py-16">
        <div className="shadow-lift flex flex-col gap-6 rounded-2xl bg-white p-6 sm:p-9">
          <div className="flex flex-col gap-2 text-center">
            <span className="text-brand-blue text-[12px] font-bold tracking-wide uppercase">Quase lá</span>
            <h1 className="text-brand-navy-900 text-2xl leading-tight font-extrabold sm:text-3xl">
              Montando o diagnóstico + plano da {companyName}
            </h1>
          </div>
          <PlanGenerationProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10 sm:py-16">
      <div className="shadow-lift flex flex-col gap-6 rounded-2xl bg-white p-6 sm:p-9">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-brand-blue text-[12px] font-bold tracking-wide uppercase">Último passo</span>
          <h1 className="text-brand-navy-900 text-2xl leading-tight font-extrabold sm:text-3xl">
            Seu diagnóstico + plano está quase pronto, {companyName}
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Informe seu telefone com DDD para liberar o diagnóstico completo e o plano comercial de 90 dias.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              required
              className="h-14 text-lg"
              value={phone}
              onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "phone-error" : undefined}
              disabled={isPending}
            />
            {fieldError ? (
              <p id="phone-error" role="alert" className="text-destructive text-sm">
                {fieldError}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            aria-busy={isPending}
            className="h-16 w-full rounded-2xl text-lg font-extrabold"
          >
            {isPending ? "Liberando..." : "Ver meu diagnóstico completo"}
          </Button>

          {formError ? (
            <p role="alert" className="text-destructive text-center text-sm">
              {formError}
            </p>
          ) : null}

          <p className="text-muted-foreground flex items-start justify-center gap-1.5 text-center text-xs">
            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            Ao continuar, você concorda em receber contato da Job Content por telefone ou WhatsApp sobre o
            seu diagnóstico. Tratamos seus dados conforme a LGPD.
          </p>
        </form>
      </div>
    </div>
  );
}
