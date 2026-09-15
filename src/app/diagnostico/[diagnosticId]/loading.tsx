import { Loader2 } from "lucide-react";

import { Container } from "@/components/layout/container";

/**
 * Exibido pelo Next.js enquanto a página (Server Component) busca os
 * dados — cobre o estado "loading" da tela de resultado, mas se aplica a
 * todo o segmento /diagnostico/[id]. O caso mais demorado é a análise
 * automática do site (crawl + chamada de IA, ambos aguardados dentro do
 * próprio Server Component antes de renderizar) — por isso a mensagem é
 * escrita pensando nesse cenário, mesmo aparecendo também nas trocas de
 * tela mais rápidas da jornada.
 *
 * "motion-safe:" no ícone giratório: quem tem prefers-reduced-motion
 * ativado vê o ícone parado (a mensagem de texto já comunica "carregando"
 * sozinha, sem precisar do movimento).
 */
export default function DiagnosticLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="border-border h-16 border-b" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <Loader2 className="text-brand-blue motion-safe:animate-spin size-8" aria-hidden="true" />
          <p role="status" className="text-muted-foreground max-w-sm text-sm sm:text-base">
            Estamos analisando o seu site, isso pode levar alguns minutos. Por favor, aguarde.
          </p>
        </Container>
      </main>
    </div>
  );
}
