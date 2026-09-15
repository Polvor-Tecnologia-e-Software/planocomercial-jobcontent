import type { Dimension } from "@/types/tables";

/** Rótulo em português de cada dimensão — única fonte usada em toda a tela de resultado (hero, mapa de funil, causa-raiz). */
export const DIMENSION_LABELS: Record<Dimension, string> = {
  demand: "Demanda",
  conversion: "Conversão",
  processes: "Processos",
  management: "Gestão",
  scale: "Escala",
  digital_positioning: "Posicionamento Digital",
};

export function dimensionLabel(dimension: Dimension | null): string {
  return dimension ? DIMENSION_LABELS[dimension] : "Não identificado";
}
