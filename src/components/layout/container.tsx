import * as React from "react";

import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * "default" (max-w-3xl) é o comportamento histórico, usado por todo o
   * resto da jornada (formulários, telas de resultado). "wide" (max-w-6xl)
   * existe só para a tela inicial rica (hero + seções de conteúdo) — não
   * altera nenhum outro lugar que já usa Container sem essa prop.
   */
  size?: "default" | "wide";
};

const SIZE_CLASSES: Record<NonNullable<ContainerProps["size"]>, string> = {
  default: "max-w-3xl",
  wide: "max-w-6xl",
};

/**
 * Envelope de largura máxima e espaçamento lateral responsivo.
 * Use em qualquer tela para manter o conteúdo alinhado e legível
 * do celular ao desktop.
 */
export function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}
