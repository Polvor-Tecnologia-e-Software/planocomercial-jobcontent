import { FileSearch, Megaphone, MousePointerClick } from "lucide-react";

import { SiteAnalysisAnimation } from "@/components/diagnostic/site-analysis-animation";
import { Container } from "@/components/layout/container";

const ANALYZED_ITEMS = [
  { icon: FileSearch, label: "Páginas e serviços" },
  { icon: Megaphone, label: "Oferta e público" },
  { icon: MousePointerClick, label: "Pontos de conversão" },
] as const;

/**
 * Exibido pelo Next.js enquanto a página (Server Component) busca os
 * dados — se aplica a todo o segmento /diagnostico/[id]. O caso mais
 * demorado é a análise automática do site (crawl + chamada de IA,
 * aguardados dentro do próprio Server Component antes de renderizar), por
 * isso a tela é desenhada para esse momento (pedido explícito: tela mais
 * amigável, com a animação "busca e analytics" e o tempo médio).
 */
export default function DiagnosticLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="border-border h-16 border-b" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14">
          <div className="shadow-card flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl bg-white px-6 pt-4 pb-8 text-center sm:px-10 sm:pb-10">
            <div className="w-full max-w-md">
              <SiteAnalysisAnimation />
            </div>

            <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
              <span className="bg-brand-blue/10 text-brand-blue-dark flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
                <span className="relative flex size-2">
                  <span className="bg-brand-blue absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping" />
                  <span className="bg-brand-blue relative inline-flex size-2 rounded-full" />
                </span>
                Análise em andamento
              </span>
              <h1 className="text-brand-navy-900 text-2xl leading-tight font-extrabold sm:text-3xl">
                Estamos analisando o seu site
              </h1>
              <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed sm:text-base">
                Isso pode levar cerca de <strong className="text-brand-navy-900">1 minuto</strong>, em média. O
                tempo também pode variar de acordo com a sua navegação.
              </p>
            </div>

            <ul className="flex flex-wrap justify-center gap-2">
              {ANALYZED_ITEMS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-[#E0E5EE] bg-[#F6F8FB] px-3 py-1.5 text-xs font-semibold text-[#3A465C]"
                >
                  <Icon className="text-brand-blue size-3.5" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground text-xs">Não feche esta página — ela avança sozinha.</p>
          </div>
        </Container>
      </main>
    </div>
  );
}
