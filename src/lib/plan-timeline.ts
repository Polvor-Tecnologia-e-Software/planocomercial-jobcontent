import { ACTION_TYPE_COLOR, ACTION_TYPE_LABEL } from "@/lib/plan-action-types";
import type { ActionType, CommercialPlan90Days, PlanAction } from "@/schemas/commercial-plan";

/**
 * Deriva o cronograma e a matriz "frente x mês" a partir das ações já
 * geradas pela IA (plan90Days) — nunca pede um dado novo à IA pra isso e
 * nunca recalcula nada que ela já decidiu (mesmo princípio de
 * numeric-guard.ts: a IA decide o conteúdo, o código deriva a visualização).
 * Uma "frente" é um actionType que aparece em pelo menos uma ação em
 * qualquer uma das 3 fases; a ordem das frentes é sempre a mesma (ordem de
 * ActionTypeSchema), então o mesmo plano sempre produz a mesma matriz.
 */

export const PLAN_PHASE_KEYS = ["days1to30", "days31to60", "days61to90"] as const;
export type PlanPhaseKey = (typeof PLAN_PHASE_KEYS)[number];

export type PlanMonthMeta = {
  key: PlanPhaseKey;
  tab: string;
  days: string;
  name: string;
  /** Cor da fase (navy/azul/laranja) — mesmo esquema de PHASES em plan-90-days-section.tsx e commercial-plan-document.tsx. */
  color: string;
};

export const PLAN_MONTHS: readonly PlanMonthMeta[] = [
  { key: "days1to30", tab: "Mês 1", days: "Dias 1–30", name: "Estruturar a base", color: "#0B1A33" },
  { key: "days31to60", tab: "Mês 2", days: "Dias 31–60", name: "Ativar a demanda", color: "#1557C0" },
  { key: "days61to90", tab: "Mês 3", days: "Dias 61–90", name: "Escalar e otimizar", color: "#C2500F" },
];

/** Ordem fixa de exibição das frentes — mesma ordem de ActionTypeSchema (src/schemas/commercial-plan.ts). */
const FRONT_ORDER: ActionType[] = [
  "content_blog",
  "rich_material",
  "landing_page",
  "paid_traffic",
  "seo",
  "sales_process",
  "sales_training",
  "crm_pipeline",
  "other",
];

export type PlanFrontCell = {
  actions: PlanAction[];
};

export type PlanFront = {
  actionType: ActionType;
  label: string;
  color: string;
  /** Sempre 3 células, na mesma ordem de PLAN_MONTHS. */
  cells: PlanFrontCell[];
};

/**
 * Uma frente só aparece se tiver pelo menos 1 ação em qualquer fase —
 * nunca lista um actionType "vazio" só porque ele existe no schema.
 */
export function buildPlanFronts(plan90Days: CommercialPlan90Days): PlanFront[] {
  const actionsByMonth = PLAN_PHASE_KEYS.map((key) => plan90Days[key]);

  return FRONT_ORDER.filter((actionType) =>
    actionsByMonth.some((actions) => actions.some((action) => action.actionType === actionType)),
  ).map((actionType) => ({
    actionType,
    label: ACTION_TYPE_LABEL[actionType],
    color: ACTION_TYPE_COLOR[actionType],
    cells: actionsByMonth.map((actions) => ({
      actions: actions.filter((action) => action.actionType === actionType),
    })),
  }));
}
