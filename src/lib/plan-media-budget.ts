import type { MediaChannelPriority, StrategicSummary } from "@/schemas/commercial-plan";

/**
 * Converte a prioridade QUALITATIVA de cada canal (o que a IA de fato
 * decide, ver StrategicSummarySchema.mediaBudgetPriority) numa porcentagem
 * de verba — sempre calculada aqui, nunca pela IA. A IA não tem nenhum
 * dado real de custo de mídia no contexto pra basear uma porcentagem
 * específica; deixá-la inventar "Google 40%, LinkedIn 30%..." seria
 * exatamente o tipo de métrica fantasma que numeric-guard.ts existe pra
 * barrar em outros campos — aqui a defesa é nem dar à IA a chance de
 * escrever um número, só um rótulo.
 *
 * Pesos proporcionais à prioridade, normalizados pra somar 100: o maior
 * resto (largest remainder method) garante que a soma bate exatamente em
 * 100 mesmo com arredondamento, sem viesar sistematicamente o último
 * canal da lista.
 */
const PRIORITY_WEIGHT: Record<MediaChannelPriority, number> = {
  alta: 4,
  media: 3,
  baixa: 2,
  teste: 1,
};

export type MediaBudgetSlice = {
  channel: string;
  priority: MediaChannelPriority;
  percent: number;
};

export function computeMediaBudgetSplit(
  mediaBudgetPriority: StrategicSummary["mediaBudgetPriority"],
): MediaBudgetSlice[] {
  const weights = mediaBudgetPriority.map((entry) => PRIORITY_WEIGHT[entry.priority]);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const raw = weights.map((w) => (w / totalWeight) * 100);
  const floors = raw.map((v) => Math.floor(v));
  let remainder = 100 - floors.reduce((sum, v) => sum + v, 0);

  // Distribui o resto (no máximo n-1 pontos percentuais) pros itens com a
  // maior parte fracionária perdida no arredondamento pra baixo.
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);

  const percents = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    percents[order[k].i] += 1;
  }

  return mediaBudgetPriority.map((entry, i) => ({
    channel: entry.channel,
    priority: entry.priority,
    percent: percents[i],
  }));
}
