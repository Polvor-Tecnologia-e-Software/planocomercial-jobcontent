"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
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
import { confirmSiteAnalysisAction } from "@/server/actions/confirm-site-analysis-action";
import { continueWithoutAnalysisAction } from "@/server/actions/continue-without-analysis-action";
import { rejectSiteAnalysisAction } from "@/server/actions/reject-site-analysis-action";
import { listToLines } from "@/lib/validation/site-analysis-confirmation";
import type { SiteAnalysisResult } from "@/lib/ai/site-analysis-schema";

type SiteAnalysisConfirmationProps = {
  diagnosticId: string;
  companyId: string;
  siteAnalysisId: string;
  result: SiteAnalysisResult;
};

const CONFIDENCE_LABEL: Record<SiteAnalysisResult["confidence"], string> = {
  low: "Confiança baixa",
  medium: "Confiança média",
  high: "Confiança alta",
};

const CONFIDENCE_BADGE_VARIANT: Record<
  SiteAnalysisResult["confidence"],
  "outline" | "secondary" | "default"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
};

/** Une CTAs e ativos de conversão identificados no site num único conceito de "mecanismos de conversão", sem duplicar itens. */
function mergeConversionMechanisms(result: SiteAnalysisResult): string[] {
  return Array.from(new Set([...result.calls_to_action, ...result.conversion_assets]));
}

/**
 * Tela 3 — Confirmação (seção 5.2 do BRD). Mostra o que a análise
 * automática entendeu sobre a empresa e permite confirmar, editar os
 * campos antes de confirmar, dizer que está incorreto, ou seguir sem
 * usar esses dados — em nenhum dos quatro casos a jornada trava.
 */
export function SiteAnalysisConfirmation({
  diagnosticId,
  companyId,
  siteAnalysisId,
  result,
}: SiteAnalysisConfirmationProps) {
  const [editing, setEditing] = useState(false);
  const confidenceHeadingId = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-1 flex-col justify-center py-10 sm:py-16"
    >
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl sm:text-2xl">
              Foi isso que entendemos sobre sua empresa
            </CardTitle>
            <Badge
              variant={CONFIDENCE_BADGE_VARIANT[result.confidence]}
              id={confidenceHeadingId}
            >
              {CONFIDENCE_LABEL[result.confidence]}
            </Badge>
          </div>
          <CardDescription>
            Isso é uma inferência automática a partir do seu site — não são fatos
            confirmados. Confira cada campo e ajuste o que não estiver certo antes de
            continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form
            id="confirm-site-analysis-form"
            action={confirmSiteAnalysisAction}
            aria-describedby={confidenceHeadingId}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="diagnosticId" value={diagnosticId} />
            <input type="hidden" name="companyId" value={companyId} />
            <input type="hidden" name="siteAnalysisId" value={siteAnalysisId} />
            <input type="hidden" name="edited" value={editing ? "true" : "false"} />

            <EditableField
              label="Descrição"
              name="description"
              defaultValue={result.description ?? ""}
              editing={editing}
              multiline
            />
            <EditableField
              label="Segmento"
              name="segment"
              defaultValue={result.segment ?? ""}
              editing={editing}
            />
            <EditableField
              label="Principal oferta"
              name="mainOffer"
              defaultValue={result.main_offer ?? ""}
              editing={editing}
            />
            <EditableField
              label="Público aparente"
              name="targetAudience"
              defaultValue={result.apparent_target_audience ?? ""}
              editing={editing}
            />
            <EditableField
              label="Modelo comercial provável"
              name="businessModel"
              defaultValue={result.probable_business_model ?? ""}
              editing={editing}
            />
            <EditableListField
              label="Diferenciais"
              name="differentiators"
              values={result.differentiators}
              editing={editing}
            />
            <EditableListField
              label="Provas"
              name="commercialProofs"
              values={result.commercial_proofs}
              editing={editing}
            />
            <EditableListField
              label="Mecanismos de conversão"
              name="conversionMechanisms"
              values={mergeConversionMechanisms(result)}
              editing={editing}
            />
          </form>

          {result.main_findings.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Outras observações</p>
              <ul className="text-muted-foreground list-inside list-disc text-sm">
                {result.main_findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="submit" form="confirm-site-analysis-form" size="lg">
              {editing ? "Salvar e continuar" : "Sim, continuar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setEditing((current) => !current)}
            >
              {editing ? "Cancelar ajuste" : "Quero ajustar"}
            </Button>
            <form action={rejectSiteAnalysisAction}>
              <input type="hidden" name="diagnosticId" value={diagnosticId} />
              <input type="hidden" name="siteAnalysisId" value={siteAnalysisId} />
              <Button type="submit" variant="ghost" size="lg">
                Não está correto
              </Button>
            </form>
            <form action={continueWithoutAnalysisAction}>
              <input type="hidden" name="diagnosticId" value={diagnosticId} />
              <input type="hidden" name="siteAnalysisId" value={siteAnalysisId} />
              <input type="hidden" name="reason" value="user_declined" />
              <Button type="submit" variant="ghost" size="lg">
                Continuar sem usar esses dados
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EditableField(props: {
  label: string;
  name: string;
  defaultValue: string;
  editing: boolean;
  multiline?: boolean;
}) {
  const { label, name, defaultValue, editing, multiline } = props;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {editing ? (
        multiline ? (
          <textarea
            id={name}
            name={name}
            defaultValue={defaultValue}
            rows={3}
            className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm shadow-sm"
          />
        ) : (
          <Input id={name} name={name} defaultValue={defaultValue} />
        )
      ) : (
        <>
          <input type="hidden" name={name} value={defaultValue} />
          <p className="text-sm">
            {defaultValue || (
              <span className="text-muted-foreground">Não identificado</span>
            )}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Campo de lista (diferenciais, provas, mecanismos de conversão): exibida
 * como marcadores fora do modo de edição, e como um único textarea (uma
 * linha por item) dentro dele — mais simples de editar num formulário do
 * que múltiplos campos soltos.
 */
function EditableListField(props: {
  label: string;
  name: string;
  values: string[];
  editing: boolean;
}) {
  const { label, name, values, editing } = props;
  const linesValue = listToLines(values);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {editing ? (
        <textarea
          id={name}
          name={name}
          defaultValue={linesValue}
          rows={Math.min(Math.max(values.length, 2), 6)}
          aria-describedby={`${name}-hint`}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm shadow-sm"
        />
      ) : (
        <>
          <input type="hidden" name={name} value={linesValue} />
          {values.length > 0 ? (
            <ul className="list-inside list-disc text-sm">
              {values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Não identificado</p>
          )}
        </>
      )}
      {editing ? (
        <p id={`${name}-hint`} className="text-muted-foreground text-xs">
          Um item por linha.
        </p>
      ) : null}
    </div>
  );
}
