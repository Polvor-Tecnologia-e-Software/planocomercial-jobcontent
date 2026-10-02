import type { ActionType, CadenceBrief, CadenceChannel } from "@/schemas/commercial-plan";

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
  landing_page: "Landing page",
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
  landing_page: "#0369A1",
  paid_traffic: "#C2410C",
  seo: "#0F766E",
  sales_process: "#B45309",
  sales_training: "#9D174D",
  crm_pipeline: "#1D4ED8",
  other: "#5B6478",
};

/** Rótulo de cada canal de uma cadência comercial — mesmo uso compartilhado tela/PDF. */
export const CADENCE_CHANNEL_LABEL: Record<CadenceChannel, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  phone: "Telefone",
  linkedin: "LinkedIn",
};

/** "Dia 01", "Dia 02"... — o número do dia vem da posição na cadência, nunca da IA. */
export function cadenceDayLabel(index: number): string {
  return `Dia ${String(index + 1).padStart(2, "0")}`;
}

/** "E-mail + WhatsApp" — os canais de um dia da cadência, na ordem em que vieram. */
export function cadenceChannelsLabel(day: CadenceBrief["days"][number]): string {
  return day.channels.map((channel) => CADENCE_CHANNEL_LABEL[channel]).join(" + ");
}
