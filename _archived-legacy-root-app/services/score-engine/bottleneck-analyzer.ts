import type { DiagnosticAnswer } from "@/types";
import type { Bottleneck, AnswerMap } from "./types";
import {
  BOTTLENECK_SEVERITY_THRESHOLDS,
  CRITICAL_SIGNALS,
} from "./constants";

// ─── Bottleneck copy library ──────────────────────────────────────────────────
const BOTTLENECK_COPY: Record<
  string,
  {
    title: string;
    description: string;
    business_impact: string;
    quick_wins: string[];
  }
> = {
  demanda: {
    title: "Geração de Demanda Insuficiente",
    description:
      "Sua empresa não gera leads qualificados em volume suficiente para alimentar o funil comercial. O pipeline resseca antes de chegar aos vendedores.",
    business_impact:
      "Sem demanda consistente, sua equipe de vendas desperdiça tempo prospectando ao invés de fechar. O crescimento fica limitado pela entrada do funil.",
    quick_wins: [
      "Documentar e ativar o ICP em 1 semana",
      "Implementar cadência de prospecção outbound diária",
      "Criar 3 materiais de atração de topo de funil",
      "Definir meta semanal de novos contatos",
      "Ativar LinkedIn Sales Navigator para prospecção",
    ],
  },
  conversao: {
    title: "Baixa Taxa de Conversão",
    description:
      "Leads chegam mas não avançam pelo funil com eficiência. O problema está no processo de vendas, follow-up ou qualidade dos materiais de apoio.",
    business_impact:
      "Cada ponto percentual de conversão perdido representa receita que vai direto para o concorrente. Com o mesmo volume de leads, um processo melhor gera 2-3x mais receita.",
    quick_wins: [
      "Mapear e documentar as etapas do processo de vendas",
      "Criar cadência de follow-up com 6-8 touchpoints",
      "Desenvolver 1 case de sucesso para cada segmento-chave",
      "Implementar agenda de reunião padronizada",
      "Criar proposta comercial visual e estruturada",
    ],
  },
  escala: {
    title: "Incapacidade de Escalar",
    description:
      "O modelo comercial funciona mas depende de pessoas-chave e não pode ser replicado. Crescer significa contratar heróis, não replicar um sistema.",
    business_impact:
      "Sem escala, cada novo vendedor leva meses para produzir. O CAC aumenta e a previsibilidade de receita é zero, inviabilizando investimento e crescimento.",
    quick_wins: [
      "Implementar CRM com pipeline padronizado",
      "Documentar playbook de vendas em até 30 dias",
      "Definir metas SMART e acompanhamento semanal",
      "Criar onboarding de vendedor com ramp-up em 60 dias",
      "Calcular CAC e LTV para embasar decisões",
    ],
  },
};

// ─── Classify severity based on score ────────────────────────────────────────
function classifySeverity(score: number): Bottleneck["severity"] {
  if (score <= BOTTLENECK_SEVERITY_THRESHOLDS.critical) return "critical";
  if (score <= BOTTLENECK_SEVERITY_THRESHOLDS.moderate) return "moderate";
  return "mild";
}

// ─── Identify and rank all bottlenecks ───────────────────────────────────────
export function identifyBottlenecks(
  demanda: number,
  conversao: number,
  escala: number
): Bottleneck[] {
  const pillars: Array<{ type: "demanda" | "conversao" | "escala"; score: number }> = [
    { type: "demanda",   score: demanda   },
    { type: "conversao", score: conversao },
    { type: "escala",    score: escala    },
  ];

  // Sort ascending — worst first
  const sorted = [...pillars].sort((a, b) => a.score - b.score);

  return sorted.map((p, i) => {
    const copy = BOTTLENECK_COPY[p.type];
    const nextPillar = sorted[i + 1];
    const gapToNext = nextPillar ? nextPillar.score - p.score : 0;

    return {
      type: p.type,
      severity: classifySeverity(p.score),
      score: p.score,
      gap_to_next: Math.round(gapToNext),
      title: copy.title,
      description: copy.description,
      business_impact: copy.business_impact,
      quick_wins: copy.quick_wins,
    };
  });
}

// ─── Extract critical signals from specific answers ───────────────────────────
// Returns list of signal keys that fired (e.g. "m3_q1:indicacao")
export function extractCriticalSignals(answers: DiagnosticAnswer[]): string[] {
  const fired: string[] = [];

  for (const answer of answers) {
    const key = `${answer.question_id}:${answer.value}`;
    if (CRITICAL_SIGNALS[key]) {
      fired.push(key);
    }
  }

  return fired;
}

// ─── Check if a specific answer signal fired ─────────────────────────────────
export function signalFired(answerMap: AnswerMap, questionId: string, value: string): boolean {
  const answer = answerMap.get(questionId);
  return answer?.value === value;
}
