import type { Metadata } from "next";

import { DiagnosticJourney } from "@/components/diagnostic/diagnostic-journey";

export const metadata: Metadata = {
  title: "Criar meu plano comercial | Plano Comercial Inteligente em 90 Dias™",
};

/**
 * Ponto de entrada da jornada do diagnóstico. A máquina de estados que
 * avança entre as telas fica em DiagnosticJourney (client component) —
 * esta página em si é só o wrapper de metadata/rota.
 */
export default function DiagnosticoPage() {
  return <DiagnosticJourney />;
}
