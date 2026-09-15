import type { DiagnosticAnswer, ScoreLevel } from "@/types";
import type {
  CompanyProfile,
  MaturityProfile,
  CommercialArchetype,
  CommercialPriority,
} from "./types";
import type { Bottleneck } from "./types";
import { SCORE_LEVEL_META, ARCHETYPE_META } from "./constants";
import { buildAnswerMap } from "./calculator";
import { pointsToNextLevel } from "./calculator";

// ─── Extract structured company profile from answers ─────────────────────────
export function buildCompanyProfile(answers: DiagnosticAnswer[]): CompanyProfile {
  const map = buildAnswerMap(answers);
  const get = (id: string): string => String(map.get(id)?.value ?? "");

  return {
    commercial_stage:   get("m1_q1"),
    team_size:          get("m1_q2"),
    avg_ticket:         get("m1_q3"),
    lead_source:        get("m3_q1"),
    monthly_leads:      get("m3_q2"),
    has_icp:            !["nao_conhece", ""].includes(get("m3_q3")),
    outbound_frequency: get("m3_q4"),
    conversion_rate:    get("m4_q1"),
    has_sales_process:  !["nao", ""].includes(get("m4_q2")),
    uses_crm:           !["nao", ""].includes(get("m5_q1")),
    has_goals:          !["nao", ""].includes(get("m2_q1")),
    tracks_metrics:     !["nenhum", ""].includes(get("m2_q2")),
    knows_cac_ltv:      !["nao_mensura", ""].includes(get("m6_q2")),
  };
}

// ─── Determine commercial archetype from profile ──────────────────────────────
export function classifyArchetype(
  profile: CompanyProfile,
  overallScore: number
): CommercialArchetype {
  const { team_size, uses_crm, has_sales_process, has_icp, has_goals } = profile;

  if (team_size === "1") return "founder_seller";

  if (overallScore < 30) return "early_team";

  if (!has_sales_process && !uses_crm) return "early_team";

  if (has_sales_process && !uses_crm) return "building_machine";

  if (uses_crm && has_goals && has_icp && !profile.tracks_metrics)
    return "scaling_machine";

  if (uses_crm && has_goals && has_icp && profile.tracks_metrics && profile.knows_cac_ltv)
    return "performance_engine";

  return "building_machine";
}

// ─── Build maturity profile ───────────────────────────────────────────────────
export function buildMaturityProfile(
  overallScore: number,
  level: ScoreLevel,
  profile: CompanyProfile
): MaturityProfile {
  const meta = SCORE_LEVEL_META[level];
  const archetype = classifyArchetype(profile, overallScore);

  return {
    level,
    label:         meta.label,
    description:   meta.description,
    color:         meta.color,
    next_level:    meta.next,
    points_to_next: pointsToNextLevel(overallScore, level),
    archetype,
  };
}

// ─── Generate commercial priorities ──────────────────────────────────────────
// Up to 6 priorities, sorted by impact × urgency, based on bottlenecks and profile.
export function generatePriorities(
  bottlenecks: Bottleneck[],
  profile: CompanyProfile,
  overallScore: number
): CommercialPriority[] {
  const priorities: CommercialPriority[] = [];
  let rank = 1;

  // Priority 1: Always address the main bottleneck first
  const [main, second, third] = bottlenecks;

  // ── Demanda priorities ──────────────────────────────────────────────────────
  if (main.type === "demanda" || main.severity === "critical") {
    if (!profile.has_icp) {
      priorities.push({
        rank: rank++,
        pillar: "demanda",
        title: "Definir e documentar o ICP",
        description:
          "Sem ICP claro, toda prospecção é ruído. Documentar perfil ideal de cliente (segmento, porte, cargo, dores) é o primeiro passo para gerar demanda qualificada.",
        effort: "low",
        impact: "high",
        time_horizon: "30d",
        kpis: ["ICP documentado", "Lista de 50 contas-alvo definidas"],
      });
    }

    if (profile.outbound_frequency === "nunca" || profile.outbound_frequency === "esporadico") {
      priorities.push({
        rank: rank++,
        pillar: "demanda",
        title: "Implementar cadência de prospecção outbound",
        description:
          "Criar rotina diária de prospecção com sequência de emails + LinkedIn + ligação. Meta: 10 contatos novos por dia por SDR.",
        effort: "medium",
        impact: "high",
        time_horizon: "30d",
        kpis: ["10+ contatos/dia/SDR", "Taxa de resposta >8%", "30 MQLs/mês em 60 dias"],
      });
    }

    if (profile.lead_source === "indicacao") {
      priorities.push({
        rank: rank++,
        pillar: "demanda",
        title: "Diversificar canais de aquisição",
        description:
          "Dependência de indicações cria receita imprevisível. Implementar ao menos 2 canais ativos (content + outbound) nos próximos 60 dias.",
        effort: "medium",
        impact: "high",
        time_horizon: "60d",
        kpis: [
          "2 canais ativos além de indicações",
          "30% dos leads vindos de canal novo em 90 dias",
        ],
      });
    }
  }

  // ── Conversão priorities ────────────────────────────────────────────────────
  if (
    main.type === "conversao" ||
    second?.type === "conversao" ||
    !profile.has_sales_process
  ) {
    if (!profile.has_sales_process) {
      priorities.push({
        rank: rank++,
        pillar: "conversao",
        title: "Documentar processo de vendas com etapas claras",
        description:
          "Criar playbook de vendas com definição de cada etapa, critérios de avanço, e script de discovery. Reduz dependência de vendedores-herói.",
        effort: "medium",
        impact: "high",
        time_horizon: "30d",
        kpis: [
          "Playbook documentado em 30 dias",
          "100% do time seguindo o processo",
        ],
      });
    }

    if (profile.conversion_rate === "abaixo_5" || profile.conversion_rate === "5_15") {
      priorities.push({
        rank: rank++,
        pillar: "conversao",
        title: "Implementar cadência de follow-up com múltiplos touchpoints",
        description:
          "80% das vendas exigem 5+ contatos. Criar sequência de 8 touchpoints em 21 dias (email + WhatsApp + ligação) para leads que não responderam.",
        effort: "low",
        impact: "high",
        time_horizon: "30d",
        kpis: [
          "Cadência de 8 touchpoints ativa",
          "Reativação de 10% dos leads frios",
          "Aumento de 20% na taxa de resposta",
        ],
      });
    }
  }

  // ── Escala priorities ───────────────────────────────────────────────────────
  if (
    main.type === "escala" ||
    second?.type === "escala" ||
    !profile.uses_crm
  ) {
    if (!profile.uses_crm) {
      priorities.push({
        rank: rank++,
        pillar: "escala",
        title: "Implementar CRM como central da operação",
        description:
          "Sem CRM, não há visibilidade de pipeline, previsão de receita ou dados para decisão. Implementar CRM (HubSpot, Pipedrive ou RD Station) em 30 dias.",
        effort: "medium",
        impact: "high",
        time_horizon: "30d",
        kpis: [
          "CRM implementado e adotado pelo time",
          "100% das oportunidades no CRM",
          "Relatório semanal de pipeline",
        ],
      });
    }

    if (!profile.has_goals) {
      priorities.push({
        rank: rank++,
        pillar: "escala",
        title: "Definir metas comerciais com método SMART",
        description:
          "Sem metas claras, o time não sabe o que priorizar. Definir meta mensal de receita, número de reuniões, propostas e fechamentos.",
        effort: "low",
        impact: "medium",
        time_horizon: "30d",
        kpis: [
          "Meta mensal de receita definida",
          "Metas individuais por vendedor",
          "Revisão semanal de resultados",
        ],
      });
    }

    if (!profile.knows_cac_ltv) {
      priorities.push({
        rank: rank++,
        pillar: "escala",
        title: "Calcular e monitorar CAC e LTV",
        description:
          "Sem saber quanto custa adquirir um cliente e quanto ele gera, é impossível tomar decisões de investimento. Implementar dashboard financeiro comercial.",
        effort: "low",
        impact: "medium",
        time_horizon: "60d",
        kpis: [
          "CAC calculado por canal",
          "LTV médio por segmento",
          "Relação LTV/CAC > 3x",
        ],
      });
    }
  }

  // Ensure we always have at least 3 priorities
  if (priorities.length === 0) {
    priorities.push({
      rank: rank++,
      pillar: main.type as "demanda" | "conversao" | "escala",
      title: "Otimizar o pilar mais fraco",
      description: main.description,
      effort: "medium",
      impact: "high",
      time_horizon: "30d",
      kpis: [`Melhorar score de ${main.type} em 15 pontos`],
    });
  }

  // Re-rank after all are pushed
  return priorities.slice(0, 6).map((p, i) => ({ ...p, rank: i + 1 }));
}
