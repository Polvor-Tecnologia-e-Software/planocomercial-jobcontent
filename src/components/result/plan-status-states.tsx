import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratePlanTrigger } from "@/components/result/generate-plan-trigger";

const STATE_SHELL_CLASS =
  "mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 py-10 text-center sm:py-16";

/** Estado "not_generated" — o diagnóstico está pronto, mas o plano ainda não foi pedido. */
export function NotGeneratedState({ diagnosticId, companyName }: { diagnosticId: string; companyName: string }) {
  return (
    <div className={STATE_SHELL_CLASS}>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl sm:text-2xl">Seu diagnóstico está pronto, {companyName}</CardTitle>
          <CardDescription>
            Já calculamos o funil, o score e o gargalo provável. Falta um passo: gerar o plano
            comercial de 90 dias interpretando esses dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneratePlanTrigger diagnosticId={diagnosticId} label="Gerar meu plano comercial" />
        </CardContent>
      </Card>
    </div>
  );
}

/** Estado "generating" — aguardando a IA responder (sem chamar a IA de novo, só mostra o status já persistido). */
export function GeneratingState({ companyName }: { companyName: string }) {
  return (
    <div className={STATE_SHELL_CLASS} role="status" aria-live="polite">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl sm:text-2xl">Gerando o plano de {companyName}...</CardTitle>
          <CardDescription>
            Isso pode levar até um minuto. Você pode atualizar esta página em instantes.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

/** Estado "failed" — nunca perde o diagnóstico: oferece tentar de novo (ou explica o limite, quando esgotado). */
export function FailedState({
  diagnosticId,
  companyName,
  canRetry,
}: {
  diagnosticId: string;
  companyName: string;
  canRetry: boolean;
}) {
  return (
    <div className={STATE_SHELL_CLASS}>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl sm:text-2xl">Não conseguimos gerar o plano de {companyName}</CardTitle>
          <CardDescription>
            Seu diagnóstico não foi perdido — os dados continuam salvos.{" "}
            {canRetry ? "Você pode tentar de novo." : "Fale com o suporte para continuar."}
          </CardDescription>
        </CardHeader>
        {canRetry ? (
          <CardContent>
            <GeneratePlanTrigger diagnosticId={diagnosticId} label="Tentar novamente" />
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
