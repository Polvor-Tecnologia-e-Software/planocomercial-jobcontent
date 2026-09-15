"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startDiagnosticAction } from "@/server/actions/start-diagnostic-action";
import { initialStartDiagnosticState } from "@/server/actions/start-diagnostic-initial-state";

/**
 * Botão de envio isolado em um componente próprio porque useFormStatus()
 * só enxerga o estado de pending do <form> mais próximo — precisa estar
 * dentro do <form>, não no componente pai que o renderiza.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Criando seu plano..." : "Continuar"}
    </Button>
  );
}

/**
 * Tela 2 (parte 1) — primeira captura da jornada: empresa, site, e-mail
 * corporativo e palavras-chave do negócio (seção 4 do BRD). Ao enviar,
 * cria company + lead parcial + diagnostic (status "started") e
 * redireciona para a próxima etapa.
 *
 * Usa useActionState (React 19) em vez de gerenciar loading/erro
 * manualmente: o próprio estado da Server Action já cobre "estados de
 * carregamento" e "mensagens de erro compreensíveis" pedidos nesta etapa,
 * e useFormStatus desabilita o botão automaticamente durante o envio —
 * o que impede envio duplicado por duplo clique.
 *
 * Os campos são controlados (useState) de propósito: o React 19 reseta os
 * campos não controlados de um <form action={...}> sempre que a action
 * termina — inclusive quando ela retorna um erro de validação, não só em
 * caso de sucesso. Sem controlar o valor aqui, uma validação que falha
 * (ex.: menos de 5 palavras-chave) apagaria tudo que a pessoa já tinha
 * preenchido nos outros campos.
 */
export function CaptureForm() {
  const [state, formAction] = useActionState(
    startDiagnosticAction,
    initialStartDiagnosticState,
  );
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-1 flex-col justify-center py-10 sm:py-16"
    >
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl sm:text-2xl">
            Vamos conhecer sua empresa
          </CardTitle>
          <CardDescription>
            Leva menos de um minuto. Depois disso, identificamos boa parte do resto
            automaticamente pelo seu site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate className="flex flex-col gap-5">
            {/* UTMs capturados da URL de origem (seção 4 do BRD). Campos
                ocultos: viajam junto com o restante do formulário sem
                aparecer para a pessoa preenchendo. */}
            <input
              type="hidden"
              name="utm_source"
              value={searchParams.get("utm_source") ?? ""}
            />
            <input
              type="hidden"
              name="utm_medium"
              value={searchParams.get("utm_medium") ?? ""}
            />
            <input
              type="hidden"
              name="utm_campaign"
              value={searchParams.get("utm_campaign") ?? ""}
            />
            <input
              type="hidden"
              name="utm_content"
              value={searchParams.get("utm_content") ?? ""}
            />
            <input
              type="hidden"
              name="utm_term"
              value={searchParams.get("utm_term") ?? ""}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex.: Maria Souza"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.name)}
                aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
              />
              {state.fieldErrors?.name ? (
                <p id="name-error" role="alert" className="text-destructive text-sm">
                  {state.fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Ex.: CodeBit Tecnologia"
                autoComplete="organization"
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.companyName)}
                aria-describedby={
                  state.fieldErrors?.companyName ? "companyName-error" : undefined
                }
              />
              {state.fieldErrors?.companyName ? (
                <p
                  id="companyName-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {state.fieldErrors.companyName}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="website">
                Site da empresa{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="website"
                name="website"
                placeholder="suaempresa.com.br"
                autoComplete="url"
                inputMode="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.website)}
                aria-describedby={
                  state.fieldErrors?.website ? "website-error" : "website-hint"
                }
              />
              {state.fieldErrors?.website ? (
                <p id="website-error" role="alert" className="text-destructive text-sm">
                  {state.fieldErrors.website}
                </p>
              ) : (
                <p id="website-hint" className="text-muted-foreground text-xs">
                  Não tem site? Sem problema — você pode continuar sem informar.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@suaempresa.com.br"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={state.fieldErrors?.email ? "email-error" : "email-hint"}
              />
              {state.fieldErrors?.email ? (
                <p id="email-error" role="alert" className="text-destructive text-sm">
                  {state.fieldErrors.email}
                </p>
              ) : (
                <p id="email-hint" className="text-muted-foreground text-xs">
                  Precisa ser um e-mail corporativo — não aceitamos e-mails pessoais (Gmail,
                  Yahoo, Hotmail, etc.).
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="keywords">Palavras-chave do negócio</Label>
              <Textarea
                id="keywords"
                name="keywords"
                placeholder="Ex.: consultoria financeira, planejamento tributário, abertura de empresa..."
                required
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors?.keywords)}
                aria-describedby={
                  state.fieldErrors?.keywords ? "keywords-error" : "keywords-hint"
                }
              />
              {state.fieldErrors?.keywords ? (
                <p id="keywords-error" role="alert" className="text-destructive text-sm">
                  {state.fieldErrors.keywords}
                </p>
              ) : (
                <p id="keywords-hint" className="text-muted-foreground text-xs">
                  Liste de 5 a 10 palavras que resumem seu negócio, separadas por vírgula
                  ou uma por linha. Usamos elas para mostrar oportunidades de SEO no seu
                  plano.
                </p>
              )}
            </div>

            {state.formError ? (
              <p role="alert" className="text-destructive text-sm">
                {state.formError}
              </p>
            ) : null}

            {/* Consentimento LGPD implícito (sem checkbox separado): ao
                enviar o formulário, a pessoa concorda com este texto — ver
                LGPD_CONSENT_VERSION em src/server/start-diagnostic.ts. */}
            <p className="text-muted-foreground text-xs">
              Ao continuar, você concorda em receber este diagnóstico e contato comercial
              da Job Content por e-mail sobre o Plano Comercial Inteligente em 90 Dias™.
              Tratamos seus dados conforme a LGPD.
            </p>

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
