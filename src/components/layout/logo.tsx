import Image from "next/image";

import { cn } from "@/lib/utils";

// Dimensões intrínsecas reais do arquivo em public/logo-job-content.png
// (2000x559px) — obrigatórias aqui porque é referenciado por caminho de
// texto ("/logo-...") e não por import estático (ver node_modules/next/dist/docs/01-app/01-getting-started/12-images.md,
// seção "Local images"). Servem só para o Next.js calcular a proporção
// certa e evitar layout shift; o tamanho exibido é controlado pela altura
// fixa em HEIGHT_CLASS (largura acompanha automaticamente via w-auto).
const INTRINSIC_WIDTH = 2000;
const INTRINSIC_HEIGHT = 559;

type LogoProps = {
  /** "default" para o cabeçalho, "lg" para a tela inicial (logo maior). */
  size?: "default" | "lg";
  /**
   * "light" força o logo para branco sólido (filtro CSS) — o arquivo
   * original é colorido (azul + cinza-escuro) pensado para fundo claro;
   * sobre o cabeçalho escuro (bg-gradient-navy) o cinza ficaria quase
   * ilegível sem isso. Perde a distinção de cor entre "Job" e "content"
   * nesse modo, mas garante contraste — trocar por um arquivo already-white
   * da Job Content quando/se existir.
   */
  variant?: "default" | "light";
  className?: string;
};

const HEIGHT_CLASS: Record<NonNullable<LogoProps["size"]>, string> = {
  default: "h-9",
  lg: "h-16 sm:h-20",
};

/**
 * Arquivo real da Job Content (public/logo-job-content.png), já inclui o
 * wordmark "Jobcontent" e a linha "Agência de Inbound Marketing".
 * Renderizado por altura fixa e largura automática, para caber tanto
 * pequeno no cabeçalho quanto grande na tela inicial sem distorcer.
 */
export function Logo({ size = "default", variant = "default", className }: LogoProps) {
  return (
    <Image
      src="/logo-job-content.png"
      alt="Job Content — Agência de Inbound Marketing"
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      className={cn(
        "w-auto",
        HEIGHT_CLASS[size],
        variant === "light" && "brightness-0 invert",
        className,
      )}
      priority={size === "lg"}
    />
  );
}
