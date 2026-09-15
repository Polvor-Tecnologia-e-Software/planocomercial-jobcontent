/**
 * Política de arredondamento e validação numérica do motor de cálculos.
 * Centralizada aqui para que toda a engine (taxas, engenharia reversa,
 * gaps, score, qualidade de dados) arredonde e valide da mesma forma.
 *
 * - Contagens necessárias (clientes, propostas, reuniões, oportunidades,
 *   leads): sempre arredondadas PARA CIMA — "3.2 clientes" não é uma
 *   contagem válida, o mínimo necessário é 4.
 * - Gaps: inteiros, nunca negativos (clamp em 0).
 * - Percentuais/scores exibíveis (score de dimensão, qualidade de dados):
 *   arredondados ao inteiro mais próximo.
 * - Taxas internas (0 a 1): mantidas em ponto flutuante; só arredondadas
 *   ao exibir como percentual.
 */

/** Maior número aceito como resposta numérica de diagnóstico — mesmo limite usado em adaptive-engine.validateAnswerValue, mantido em sincronia. */
export const MAX_SANE_NUMBER = 100_000_000;

export function isValidFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_SANE_NUMBER;
}

/** Normaliza um valor de resposta (que pode ser string ou number, vindo de diagnostic_answers) para um número válido, ou null se ausente/inválido — nunca lança. */
export function toSaneNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const num = typeof value === "number" ? value : Number(value);
  return isValidFiniteNonNegative(num) ? num : null;
}

export function roundUpToInt(value: number): number {
  return Math.ceil(value);
}

export function roundToInt(value: number): number {
  return Math.round(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converte uma taxa (0-1) num percentual arredondado a 1 casa decimal, só para exibição/relatório — nunca use o resultado de volta em cálculos. */
export function roundRateToPercent(rate: number): number {
  return Math.round(rate * 1000) / 10;
}

/**
 * Uma taxa é válida quando finita e não-negativa. NÃO limitamos a 1 (100%):
 * embora a maioria das taxas de conversão do funil (lead→oportunidade,
 * reunião→proposta, proposta→venda) fique abaixo de 100% na prática, uma
 * etapa real de negócio pode legitimamente ter mais contagem na "ponta de
 * baixo" que na "ponta de cima" sem que isso seja dado inconsistente — o
 * caso mais comum é oportunidade→reunião: é normal uma mesma oportunidade
 * gerar várias reuniões (descoberta, demonstração, negociação...), então
 * meetingsPerMonth > opportunitiesPerMonth é uma forma legítima e comum de
 * operar, não um erro de digitação. Rejeitar essas taxas como "inválidas"
 * zerava a taxa inteira e quebrava a cadeia de engenharia reversa acima
 * dela (Oportunidades e Leads necessários ficavam sempre "—", mesmo com
 * dados reais completos) — corrigido após confirmar com um caso real
 * (5 reuniões / 2 oportunidades por mês, uma proporção plausível).
 */
export function isValidRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
