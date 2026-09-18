/**
 * Impede que um número (taxa, percentual, contagem) que a IA cite nos
 * campos de texto do plano seja aceito se não vier rastreável ao
 * contexto que foi de fato enviado a ela — a IA interpreta os números já
 * calculados, nunca inventa um novo.
 *
 * Heurística, não uma prova formal: procura, nos campos de MAIOR risco de
 * fabricação (interpretação do gap, causa-raiz, valores de indicadores —
 * onde um número específico e concreto apareceria), qualquer token
 * numérico que não exista em lugar nenhum do JSON do contexto enviado.
 * Números estruturais do próprio formato do relatório (1 a 3 prioridades,
 * fases de 30/60/90 dias) nunca contam como inventados.
 */
import type { CommercialPlan } from "@/schemas/commercial-plan";

const STRUCTURAL_SAFE_NUMBERS = new Set(["0", "1", "2", "3", "30", "60", "90"]);

const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/g;

export function extractNumericTokens(text: string): string[] {
  return text.match(NUMBER_PATTERN) ?? [];
}

function normalizeNumber(raw: string): string {
  return raw.replace(",", ".").replace(/^0+(?=\d)/, "");
}

/**
 * Candidatos de normalização para um número CITADO PELA IA no texto livre
 * do plano — além da normalização padrão (vírgula decimal -> ponto),
 * inclui a leitura "ponto como separador de milhar" (ex.: "300.000" = 300
 * mil), convenção comum em pt-BR para valores em reais. Bug real: a IA
 * escreveu a própria meta (goalGapInterpretation citando "R$ 300.000",
 * quando o contexto tem monthlyGoal=300000 puro) e a validação rejeitou
 * como número inventado, mesmo sendo o valor certo só formatado diferente.
 * Só usado do lado do texto da IA — buildAllowedNumberSet (o que veio do
 * CONTEXTO) nunca passa por aqui, pra não abrir uma brecha nova do lado
 * que é fonte da verdade.
 */
function candidateNormalizations(raw: string): string[] {
  const candidates = [normalizeNumber(raw)];

  const thousandsMatch = /^(\d+)\.(\d{3})$/.exec(raw);
  if (thousandsMatch) {
    candidates.push(`${thousandsMatch[1]}${thousandsMatch[2]}`.replace(/^0+(?=\d)/, ""));
  }

  return candidates;
}

export function buildAllowedNumberSet(contextJson: string): Set<string> {
  const tokens = extractNumericTokens(contextJson).map(normalizeNumber);
  return new Set([...tokens, ...STRUCTURAL_SAFE_NUMBERS]);
}

/** Campos de texto livre onde uma métrica concreta e específica apareceria — não varremos o plano inteiro (nomes de indicador, títulos etc. teriam falsos positivos demais). */
function riskFieldsOf(plan: CommercialPlan): { field: string; text: string }[] {
  const fields: { field: string; text: string }[] = [
    { field: "goalGapInterpretation", text: plan.goalGapInterpretation },
    { field: "rootCause.description", text: plan.rootCause.description },
  ];

  plan.indicators.forEach((indicator, index) => {
    if (indicator.currentValue) {
      fields.push({ field: `indicators[${index}].currentValue`, text: indicator.currentValue });
    }
    if (indicator.targetValue) {
      fields.push({ field: `indicators[${index}].targetValue`, text: indicator.targetValue });
    }
  });

  return fields;
}

export type UngroundedNumberFinding = { field: string; value: string };

export function findUngroundedNumbers(
  plan: CommercialPlan,
  contextJson: string,
): UngroundedNumberFinding[] {
  const allowed = buildAllowedNumberSet(contextJson);
  const findings: UngroundedNumberFinding[] = [];

  for (const { field, text } of riskFieldsOf(plan)) {
    for (const raw of extractNumericTokens(text)) {
      const isGrounded = candidateNormalizations(raw).some((candidate) => allowed.has(candidate));
      if (!isGrounded) {
        findings.push({ field, value: raw });
      }
    }
  }

  return findings;
}

/** Lançado quando o plano tem um número não rastreável ao contexto — tratado pela orquestração como uma saída inválida da IA, igual a uma falha de schema. */
export class UngroundedNumberError extends Error {
  constructor(readonly findings: UngroundedNumberFinding[]) {
    super(
      `Plano contém ${findings.length} número(s) não rastreável(is) ao contexto: ${findings
        .map((f) => `${f.field}="${f.value}"`)
        .join(", ")}`,
    );
    this.name = "UngroundedNumberError";
  }
}
