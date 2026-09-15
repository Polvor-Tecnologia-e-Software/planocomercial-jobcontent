"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { getCommercialPlanPdfAction } from "@/server/actions/get-commercial-plan-pdf-action";

type DownloadPdfButtonProps = {
  diagnosticId: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  plan_not_ready: "O plano ainda não foi gerado — gere o plano antes de baixar o PDF.",
  diagnostic_not_found: "Não encontramos este diagnóstico.",
  generating: "Já existe uma geração em andamento — aguarde alguns segundos e tente de novo.",
  render_failed: "Não conseguimos montar o PDF agora. Tente novamente.",
  upload_failed: "Não conseguimos salvar o PDF agora. Tente novamente.",
  signed_url_failed: "Não conseguimos gerar o link de download agora. Tente novamente.",
};

/**
 * Botão "Baixar plano em PDF": chama a Server Action, que gera (ou
 * reaproveita do cache) o arquivo e devolve uma signed URL de curta
 * duração — abrimos essa URL numa nova aba, o próprio Supabase Storage
 * serve o arquivo direto (nunca passa o binário pelo nosso servidor de
 * novo). Nunca chama IA.
 */
export function DownloadPdfButton({ diagnosticId }: DownloadPdfButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getCommercialPlanPdfAction(diagnosticId);
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.reason] ?? "Não foi possível gerar o PDF agora. Tente novamente.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="lg"
        className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/15 w-full rounded-full bg-white/10 backdrop-blur-sm sm:w-auto"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Gerando PDF..." : "Baixar plano em PDF"}
      </Button>
      {error ? (
        <p role="alert" className="text-primary-foreground/90 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
