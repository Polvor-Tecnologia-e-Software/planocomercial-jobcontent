import { Container } from "@/components/layout/container";

/**
 * Rodapé minimalista. Mantido simples nesta etapa — sem links de
 * navegação ainda, já que a jornada completa será construída nas
 * próximas etapas.
 */
export function SiteFooter() {
  return (
    <footer className="border-border/70 border-t py-8">
      <Container className="text-muted-foreground flex flex-col items-center gap-1.5 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
        <span>
          © {new Date().getFullYear()} Job Content — Plano Comercial Inteligente em 90
          Dias™
        </span>
        <span>Seus dados são tratados conforme a LGPD.</span>
      </Container>
    </footer>
  );
}
