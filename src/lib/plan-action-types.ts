import type { ActionType } from "@/schemas/commercial-plan";

/**
 * Rótulo e cor de cada tipo de ação do plano de 90 dias — usado tanto na
 * tela de resultado (src/components/result/plan-90-days-section.tsx)
 * quanto no PDF (src/lib/pdf/commercial-plan-document.tsx). Centralizado
 * aqui para as duas superfícies nunca ficarem com rótulo/cor diferentes
 * para o mesmo tipo.
 *
 * Cores em hex (não classes Tailwind) de propósito: o PDF (@react-pdf/renderer)
 * só aceita cor em hex/rgb no objeto de style, nunca uma classe CSS — manter
 * as duas superfícies lendo do mesmo valor é o que garante consistência.
 */
export const ACTION_TYPE_LABEL: Record<ActionType, string> = {
  content_blog: "Conteúdo / Blog",
  rich_material: "Material rico",
  paid_traffic: "Tráfego pago",
  seo: "SEO",
  sales_process: "Processo de vendas",
  sales_training: "Capacitação comercial",
  crm_pipeline: "CRM / Pipeline",
  other: "Outra ação",
};

export const ACTION_TYPE_COLOR: Record<ActionType, string> = {
  content_blog: "#153CA3",
  rich_material: "#6D28D9",
  paid_traffic: "#C2410C",
  seo: "#0F766E",
  sales_process: "#B45309",
  sales_training: "#9D174D",
  crm_pipeline: "#1D4ED8",
  other: "#5B6478",
};
