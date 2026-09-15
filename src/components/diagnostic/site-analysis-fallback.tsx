"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { continueWithoutAnalysisAction } from "@/server/actions/continue-without-analysis-action";

type SiteAnalysisFallbackProps = {
  diagnosticId: string;
  reason: "no_website" | "failed" | "invalid_website";
  message?: string;
};

const COPY: Record<
  SiteAnalysisFallbackProps["reason"],
  { title: string; description: string }
> = {
  no_website: {
    title: "Sem problema, vamos sem o site",
    description:
      "Você não informou um site — vamos seguir com as próximas perguntas para montar seu diagnóstico.",
  },
  failed: {
    title: "Não conseguimos analisar o site agora",
    description:
      "Isso não impede seu diagnóstico: vamos seguir com as próximas perguntas normalmente.",
  },
  invalid_website: {
    title: "O endereço do site parece estar errado",
    description:
      "Não conseguimos encontrar esse site na internet — confira se digitou o endereço certo. Você pode reiniciar para corrigi-lo, ou seguir sem a análise automática.",
  },
};

/**
 * Estado de "continuar sem análise" (seção 5.3 do BRD: falha nunca
 * bloqueia a conclusão do diagnóstico) — cobre ausência de site, falha
 * real da análise, e o caso específico de um endereço que provavelmente
 * está digitado errado (DNS não resolve, URL malformada — ver
 * invalidWebsite em src/server/analyze-site.ts). Nesse último caso, além
 * de "continuar sem análise", oferece reiniciar o diagnóstico para
 * corrigir o site, já que a causa mais provável é digitação.
 */
export function SiteAnalysisFallback({
  diagnosticId,
  reason,
  message,
}: SiteAnalysisFallbackProps) {
  const copy = COPY[reason];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-1 flex-col justify-center py-10 sm:py-16"
    >
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl sm:text-2xl">{copy.title}</CardTitle>
          <CardDescription>{message ?? copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {reason === "invalid_website" ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">Reiniciar diagnóstico</Link>
            </Button>
          ) : null}
          <form action={continueWithoutAnalysisAction}>
            <input type="hidden" name="diagnosticId" value={diagnosticId} />
            {/* ContinueWithoutSiteAnalysisReason não tem "invalid_website"
                (é só uma distinção de UI) — vira "failed" no backend, que
                já descreve corretamente o que aconteceu. */}
            <input type="hidden" name="reason" value={reason === "invalid_website" ? "failed" : reason} />
            <Button
              type="submit"
              size="lg"
              variant={reason === "invalid_website" ? "outline" : "default"}
              className="w-full sm:w-auto"
            >
              {reason === "invalid_website" ? "Continuar sem a análise" : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
