/**
 * Seção 8: engine de sinais — regras determinísticas, nunca IA.
 *
 * Reaproveita os códigos, rótulos e dimensões já declarados em
 * CHALLENGES[...].relatedSignals (src/lib/challenges/challenge-config.ts)
 * — aquele catálogo foi montado na etapa anterior claramente prevendo
 * esta engine (ver aviso de proveniência no topo daquele arquivo). Não
 * criamos aqui um segundo catálogo de códigos paralelo: cada regra abaixo
 * implementa a DETECÇÃO de um código que já existe lá.
 *
 * Implementamos detecção para os sinais com `source: "answer"` (e
 * UNCLEAR_ACQUISITION_CHANNEL, cuja evidência real é uma resposta direta
 * mesmo estando catalogada como "crm_field_mapping"). Sinais com
 * `source: "site_analysis"` (ex.: NO_CONVERSION_ASSET, LOW_COMMERCIAL_PROOF)
 * ou que dependeriam de campos de CRM nunca coletados (ex.: HIGH_MQL_NO_SQL,
 * LOW_CRM_ADOPTION) ficam fora desta etapa — não há integração com
 * site_analyses nem com um CRM externo ainda.
 */
import { SIGNAL_THRESHOLDS } from "@/lib/calculations/config";
import type { AnswerMap } from "@/lib/challenges/adaptive-engine";
import type { DetectedSignal, SignalEvidenceItem } from "@/lib/calculations/types";
import type { SelectedChallenge, Severity } from "@/types/tables";

type SignalDetection = { severity: Severity; evidence: SignalEvidenceItem[] } | null;

type SignalRule = {
  code: string;
  dimension: "demand" | "conversion" | "processes" | "management" | "scale";
  evaluate: (answers: AnswerMap) => SignalDetection;
};

function evidence(questionKey: string, answerValue: string | number): SignalEvidenceItem[] {
  return [{ questionKey, answerValue: String(answerValue) }];
}

const SIGNAL_RULES: readonly SignalRule[] = [
  // ─── D1 — demanda ──────────────────────────────────────────────────────
  {
    code: "DEPENDENCY_REFERRAL",
    dimension: "demand",
    evaluate: (answers) =>
      answers.D1_Q1 === "indicacao" ? { severity: "medium", evidence: evidence("D1_Q1", "indicacao") } : null,
  },
  {
    code: "LOW_NEW_LEADS_VOLUME",
    dimension: "demand",
    // U6 (leads/mês) é universal desde que o catálogo ganhou as perguntas
    // de volume do funil — antes só existia como D1_Q2 (só para quem
    // escolhia D1). Esse sinal agora pode disparar para qualquer desafio,
    // o que faz sentido: volume baixo de leads é relevante independente
    // do sintoma que a pessoa relatou primeiro.
    evaluate: (answers) => {
      const leads = answers.U6;
      if (typeof leads !== "number") return null;
      if (leads >= SIGNAL_THRESHOLDS.LOW_LEADS_PER_MONTH) return null;
      return { severity: "medium", evidence: evidence("U6", leads) };
    },
  },
  {
    code: "UNCLEAR_ACQUISITION_CHANNEL",
    dimension: "demand",
    evaluate: (answers) =>
      answers.D1_Q1 === "nao_sei" ? { severity: "high", evidence: evidence("D1_Q1", "nao_sei") } : null,
  },

  // ─── D2/D3 — conversão ─────────────────────────────────────────────────
  {
    code: "NO_MQL_CRITERIA",
    dimension: "conversion",
    evaluate: (answers) => {
      const value = answers.D2_Q1;
      if (value === "nao") return { severity: "high", evidence: evidence("D2_Q1", "nao") };
      if (value === "existe_nao_seguido") {
        return { severity: "medium", evidence: evidence("D2_Q1", "existe_nao_seguido") };
      }
      return null;
    },
  },
  {
    code: "STALLED_PROPOSALS",
    dimension: "conversion",
    evaluate: (answers) => {
      const days = answers.D3_Q2;
      if (typeof days !== "number") return null;
      if (days <= SIGNAL_THRESHOLDS.STALLED_PROPOSAL_DAYS) return null;
      const severity: Severity = days > SIGNAL_THRESHOLDS.STALLED_PROPOSAL_DAYS * 2 ? "high" : "medium";
      return { severity, evidence: evidence("D3_Q2", days) };
    },
  },
  {
    code: "NO_LOSS_REASON_TRACKING",
    dimension: "conversion",
    evaluate: (answers) => {
      if (answers.D3_Q1 === "nao_sabemos") {
        return { severity: "medium", evidence: evidence("D3_Q1", "nao_sabemos") };
      }
      if (answers.D3_Q3 === "nao") return { severity: "medium", evidence: evidence("D3_Q3", "nao") };
      return null;
    },
  },

  // ─── D4 — processos ────────────────────────────────────────────────────
  {
    code: "NO_SALES_PLAYBOOK",
    dimension: "processes",
    evaluate: (answers) => {
      const value = answers.D4_Q1;
      if (value === "nao") return { severity: "high", evidence: evidence("D4_Q1", "nao") };
      if (value === "existe_nao_seguido") {
        return { severity: "medium", evidence: evidence("D4_Q1", "existe_nao_seguido") };
      }
      return null;
    },
  },
  {
    code: "REP_DEPENDENCY",
    dimension: "processes",
    evaluate: (answers) => {
      const value = answers.D4_Q2;
      if (value === "impacto_grave") return { severity: "high", evidence: evidence("D4_Q2", "impacto_grave") };
      if (value === "impacto_moderado") {
        return { severity: "medium", evidence: evidence("D4_Q2", "impacto_moderado") };
      }
      return null;
    },
  },

  // ─── D5 — gestão ───────────────────────────────────────────────────────
  {
    code: "NO_PIPELINE_VISIBILITY",
    dimension: "management",
    evaluate: (answers) => {
      const value = answers.D5_Q2;
      if (value === "ninguem") return { severity: "high", evidence: evidence("D5_Q2", "ninguem") };
      if (value === "so_lideranca") return { severity: "medium", evidence: evidence("D5_Q2", "so_lideranca") };
      if (answers.D5_Q1 === "nao") return { severity: "medium", evidence: evidence("D5_Q1", "nao") };
      return null;
    },
  },
  {
    code: "STALE_FUNNEL_DATA",
    dimension: "management",
    evaluate: (answers) => {
      if (answers.D5_Q1 === "existe_desatualizado") {
        return { severity: "medium", evidence: evidence("D5_Q1", "existe_desatualizado") };
      }
      if (answers.D5_Q3 === "informal") return { severity: "medium", evidence: evidence("D5_Q3", "informal") };
      return null;
    },
  },

  // ─── D6 — escala ───────────────────────────────────────────────────────
  {
    code: "LOW_AUTOMATION",
    dimension: "scale",
    evaluate: (answers) => {
      const value = answers.D6_Q2;
      if (value === "nao") return { severity: "medium", evidence: evidence("D6_Q2", "nao") };
      if (value === "parou_de_usar") return { severity: "medium", evidence: evidence("D6_Q2", "parou_de_usar") };
      return null;
    },
  },
  {
    code: "MANUAL_HEAVY_PROCESS",
    dimension: "scale",
    evaluate: (answers) => {
      const value = answers.D6_Q1;
      if (value === "quase_tudo_manual") {
        return { severity: "high", evidence: evidence("D6_Q1", "quase_tudo_manual") };
      }
      if (value === "metade_metade") return { severity: "low", evidence: evidence("D6_Q1", "metade_metade") };
      return null;
    },
  },
];

/**
 * Avalia todas as regras de sinal contra as respostas de um diagnóstico.
 * Cada regra só é avaliada contra o valor bruto das respostas — não
 * conhece qual foi o desafio selecionado (selectedChallenge é só um
 * parâmetro documental aqui: as respostas de um desafio não escolhido
 * simplesmente não existem no AnswerMap, então as regras desse desafio
 * nunca disparam por conta própria).
 */
export function evaluateSignals(
  answers: AnswerMap,
  _selectedChallenge: SelectedChallenge | null,
): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  for (const rule of SIGNAL_RULES) {
    const detection = rule.evaluate(answers);
    if (!detection) continue;
    signals.push({
      code: rule.code,
      dimension: rule.dimension,
      severity: detection.severity,
      evidence: detection.evidence,
    });
  }

  return signals;
}
