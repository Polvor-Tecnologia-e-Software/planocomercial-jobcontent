import { Document, Page, Text, View } from "@react-pdf/renderer";

import { dimensionLabel } from "@/components/result/dimension-labels";
import { COLORS, PDF_STYLES as S } from "@/lib/pdf/commercial-plan-pdf-styles";
import {
  ACTION_TYPE_COLOR,
  ACTION_TYPE_LABEL,
  cadenceChannelsLabel,
  cadenceDayLabel,
} from "@/lib/plan-action-types";
import { computeMediaBudgetSplit, type MediaBudgetSlice } from "@/lib/plan-media-budget";
import { buildPlanFronts, PLAN_MONTHS, type PlanFront } from "@/lib/plan-timeline";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import type { Competition } from "@/lib/seo/keyword-opportunity";
import type {
  BlogBrief,
  CadenceBrief,
  CommercialPlan,
  Evidence,
  LandingPageBrief,
  PaidTrafficBrief,
  PlanAction,
  PlaybookBrief,
  RichMaterialBrief,
  StrategicSummary,
} from "@/schemas/commercial-plan";
import type { ResultFunnelStage } from "@/server/get-commercial-plan-result";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

/** Bump ao alterar o layout/conteúdo do PDF — invalida o cache mesmo com o mesmo plano (ver src/server/generate-commercial-plan-pdf.ts). */
export const PDF_TEMPLATE_VERSION = "commercial-plan-pdf-v18";

export type CommercialPlanDocumentProps = {
  companyName: string;
  /** Domínio real já normalizado (null quando a empresa não informou site) — usado nos mockups de anúncio/LP, nunca inventado. */
  companyWebsite: string | null;
  generatedAt: string;
  plan: CommercialPlan;
  funnelStages: ResultFunnelStage[];
  primaryBottleneck: Dimension | null;
  dataQualityPercentage: number | null;
  confidence: ConfidenceLevel | null;
  seoOpportunities: KeywordOpportunity[];
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

/** Mesmos rótulos e cores de src/components/result/seo-opportunities-section.tsx. */
const COMPETITION_LABEL: Record<Competition, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  unknown: "Não informada",
};

const COMPETITION_PILL: Record<Competition, { backgroundColor: string; color: string }> = {
  low: { backgroundColor: "#E4EDFB", color: COLORS.blue },
  medium: { backgroundColor: "#EEF1F5", color: "#3A465C" },
  high: { backgroundColor: "#FDE7D8", color: "#9A3F0B" },
  unknown: { backgroundColor: "#EEF1F5", color: COLORS.mutedLight },
};

const NICHE_PILL = { backgroundColor: "#FDE7D8", color: "#9A3F0B" };

const EVIDENCE_SOURCE_LABEL: Record<Evidence["source"], string> = {
  deterministic_calculation: "Cálculo",
  confirmed_data: "Dado confirmado",
  declared_answer: "Resposta declarada",
  site_fact: "Fato do site",
  inference: "Inferência",
};

/** Mesmas cores por proveniência de src/components/result/root-cause-chain.tsx. */
const EVIDENCE_SOURCE_PILL: Record<Evidence["source"], { backgroundColor: string; color: string }> = {
  confirmed_data: { backgroundColor: "#EAF5FF", color: COLORS.blue },
  declared_answer: { backgroundColor: "#EAF5FF", color: COLORS.blue },
  site_fact: { backgroundColor: "#EAF5FF", color: COLORS.blue },
  deterministic_calculation: { backgroundColor: "#EEF1F5", color: "#5B6572" },
  inference: { backgroundColor: "#FFF1E6", color: "#9A3F0B" },
};

const DAY_LABELS = ["Segunda", "Quarta", "Sexta"] as const;

/** Mesmo esquema de src/components/result/priorities-section.tsx (NUMBER_COLOR): azul, azul, laranja. */
const PRIORITY_NUMBER_COLOR = [COLORS.blue, COLORS.blue, COLORS.orangeDeep];

const PHASES: {
  key: keyof CommercialPlan["plan90Days"];
  range: string;
  label: string;
  color: string;
}[] = [
  { key: "days1to30", range: "Dias 1–30", label: "Corrigir / Estruturar", color: COLORS.navy },
  { key: "days31to60", range: "Dias 31–60", label: "Validar / Ativar", color: COLORS.blue },
  { key: "days61to90", range: "Dias 61–90", label: "Escalar / Otimizar", color: COLORS.orange },
];

const MEDIA_PRIORITY_LABEL: Record<StrategicSummary["mediaBudgetPriority"][number]["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  teste: "Teste",
};

/** Mesma paleta de src/components/result/plan-strategic-summary.tsx (SLICE_COLOR). */
const BUDGET_SLICE_COLOR = ["#3B82F6", "#93BBFA", "#F26B1D", "#56627A", "#0B1A33"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Documento do plano comercial de 90 dias em PDF — espelha exatamente os
 * dados da tela de resultado (mesmo shape de props de
 * src/server/get-commercial-plan-result.ts, estado "completed"). Nunca
 * chama IA nem recalcula nada: só formata o que já foi validado.
 *
 * Cabeçalho e rodapé usam `fixed` — o React-PDF os repete automaticamente
 * em toda página que o conteúdo gerar por paginação natural (não
 * definimos página por página manualmente). Cards usam `wrap={false}`
 * para nunca quebrar no meio entre duas páginas.
 */
export function CommercialPlanDocument({
  companyName,
  companyWebsite,
  generatedAt,
  plan,
  funnelStages,
  primaryBottleneck,
  dataQualityPercentage,
  confidence,
  seoOpportunities,
}: CommercialPlanDocumentProps) {
  // Mesma lógica de src/components/result/funnel-leak-map.tsx — a etapa
  // com maior gap ganha destaque visual (laranja) no mapa do funil.
  const calculableStages = funnelStages.filter((stage) => !stage.uncalculable);
  const biggestLeakKey =
    calculableStages.length > 0
      ? calculableStages.reduce((worst, stage) => ((stage.gap ?? -1) > (worst.gap ?? -1) ? stage : worst))
          .key
      : null;

  // Mesma derivação determinística da tela (ver src/lib/plan-timeline.ts) —
  // nunca um dado novo pedido à IA, só reorganiza o que já foi gerado.
  const fronts = buildPlanFronts(plan.plan90Days);

  // Mesmo 4º cartão do topo da tela (hero-section.tsx) — current/required
  // do estágio "leads" já calculados, nenhum número novo.
  const leadsStage = funnelStages.find((stage) => stage.key === "leads");
  const leadsCurrent = leadsStage?.current ?? null;
  const leadsRequired = leadsStage?.required ?? null;
  const hasSeoGap = seoOpportunities.some((opportunity) => opportunity.coverageGap);

  return (
    <Document
      title={`Plano Comercial Inteligente em 90 Dias — ${companyName}`}
      author="Job Content"
      creator="Job Content"
      subject="Diagnóstico comercial e plano de 90 dias"
    >
      {/* ── Capa ── */}
      <Page size="A4" style={S.coverPage}>
        <View>
          <Text style={S.coverBrand}>Job Content</Text>
          <Text style={S.coverTitle}>Plano Comercial{"\n"}Inteligente em 90 Dias</Text>
          <Text style={S.coverCompany}>{companyName}</Text>
        </View>

        <View style={S.coverFooterRow}>
          <Text style={S.coverFooterText}>Gerado em {formatDate(generatedAt)}</Text>
          <Text style={S.coverFooterText}>Documento confidencial</Text>
        </View>
      </Page>

      {/* ── Conteúdo (paginação automática) ── */}
      <Page size="A4" style={S.contentPage} wrap>
        <View style={S.pageHeader} fixed>
          <Text style={S.pageHeaderBrand}>Plano Comercial Inteligente em 90 Dias — Job Content</Text>
          <Text style={S.pageHeaderCompany}>{companyName}</Text>
        </View>
        <View style={S.pageFooter} fixed>
          <Text style={S.pageFooterText}>Documento confidencial</Text>
          <Text
            style={S.pageFooterText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

        {/* 1. Diagnóstico — diagnóstico executivo + os 4 cartões do topo da
            tela (hero-section.tsx), incluindo "Leads por mês". */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>01 · DIAGNÓSTICO</Text>
          <Text style={S.sectionTitle}>Diagnóstico executivo</Text>
          <Text style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.6, marginBottom: 4 }}>
            {plan.executiveDiagnosis}
          </Text>
          <View style={S.heroStatRow}>
            <View style={S.heroStatCard}>
              <Text style={S.heroStatLabel}>Principal gargalo</Text>
              <Text style={[S.heroStatValue, { color: COLORS.orange }]}>
                {dimensionLabel(primaryBottleneck)}
              </Text>
            </View>
            <View style={S.heroStatCard}>
              <Text style={S.heroStatLabel}>Leads por mês</Text>
              <Text style={S.heroStatValue}>{leadsCurrent !== null ? String(leadsCurrent) : "—"}</Text>
              {leadsRequired !== null ? (
                <Text style={S.heroStatSuffix}>de {leadsRequired} necessários</Text>
              ) : null}
            </View>
            <View style={S.heroStatCard}>
              <Text style={S.heroStatLabel}>Qualidade dos dados</Text>
              <Text style={S.heroStatValue}>
                {dataQualityPercentage !== null ? `${dataQualityPercentage}%` : "—"}
              </Text>
            </View>
            <View style={S.heroStatCard}>
              <Text style={S.heroStatLabel}>Confiança do diagnóstico</Text>
              <Text style={[S.heroStatValue, { color: COLORS.blue }]}>
                {confidence ? CONFIDENCE_LABEL[confidence] : "—"}
              </Text>
            </View>
          </View>
          {plan.evidence.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {plan.evidence.slice(0, 5).map((item, index) => (
                <Text key={index} style={{ fontSize: 8.5, color: COLORS.muted, marginBottom: 2 }}>
                  • {item.summary}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={S.hr} />

        {/* Mapa de gargalos — a etapa com maior gap é destacada em laranja,
            igual ao selo "Maior gargalo" da tela (funnel-leak-map.tsx). */}
        <View>
          <Text style={S.sectionTitle}>Mapa de gargalos comerciais</Text>
          {funnelStages.map((stage) => (
            <FunnelStageRow key={stage.key} stage={stage} isBiggestLeak={stage.key === biggestLeakKey} />
          ))}
        </View>

        <View style={S.hr} />

        {/* 2. Causa-raiz — cartão escuro + evidências numeradas com a
            proveniência, igual a root-cause-chain.tsx. */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>02 · CAUSA-RAIZ</Text>
          <View style={S.rootCauseCard}>
            <Text style={S.rootCauseLabel}>Causa-raiz</Text>
            <Text style={S.rootCauseText}>{plan.rootCause.description}</Text>
          </View>
          {plan.rootCause.evidence.map((item, index) => (
            <View key={index} style={S.evidenceRow}>
              <Text style={S.evidenceNumber}>{index + 1}</Text>
              <Text style={S.evidenceText}>{item.summary}</Text>
              <Text style={[S.pill, EVIDENCE_SOURCE_PILL[item.source]]}>{EVIDENCE_SOURCE_LABEL[item.source]}</Text>
            </View>
          ))}
        </View>

        <View style={S.hr} />

        {/* 3. Prioridades — mesmo layout de priorities-section.tsx: número
            (azul, azul, laranja), título, racional e uma linha de
            indicador/prazo. */}
        <View>
          <Text style={S.sectionNumber}>03 · PRIORIDADES</Text>
          <Text style={S.sectionTitle}>As três decisões que mais movem o resultado</Text>
          {plan.priorities.map((priority, index) => (
            <View key={index} style={S.card} wrap={false}>
              <Text style={[S.priorityNumber, { color: PRIORITY_NUMBER_COLOR[index % PRIORITY_NUMBER_COLOR.length] }]}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text style={S.cardTitle}>{priority.title}</Text>
              <Text style={S.cardBody}>{priority.rationale}</Text>
              <Text style={S.priorityMeta}>
                Indicador: <Text style={{ color: COLORS.text, fontFamily: "Helvetica-Bold" }}>{priority.primaryIndicator}</Text>
                {"  ·  "}Prazo: <Text style={{ color: COLORS.text, fontFamily: "Helvetica-Bold" }}>{priority.timeframe}</Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={S.hr} />

        {/* 4. Plano de ação de 90 dias — resumo estratégico, cronograma das
            frentes (ambos espelhando plan-90-days-section.tsx) e, por fim,
            cada fase com a cor da marca (navy/azul/laranja). */}
        <View>
          <Text style={S.sectionNumber}>04 · PLANO DE 90 DIAS</Text>
          <Text style={S.sectionTitle}>Plano de ação de 90 dias</Text>

          <StrategicSummaryBlock summary={plan.strategicSummary} />

          {fronts.length > 0 ? <FrontsMatrixBlock fronts={fronts} /> : null}

          {PHASES.map((phase) => (
            // Sem wrap={false} aqui de propósito: uma fase pode ter até 5
            // ações e não cabe garantir que tudo isso caiba numa página só
            // — cada ActionCard individual é que não quebra no meio
            // (wrap={false} dentro dela).
            <View key={phase.key} style={[S.phaseCard, { backgroundColor: phase.color }]}>
              <Text style={S.phaseHeader}>
                {phase.range} — {phase.label}
              </Text>
              <Text style={S.phaseGoal}>{plan.phaseSummaries[phase.key].goal}</Text>
              <View style={S.phaseMilestoneBox}>
                <Text style={S.phaseMilestoneLabel}>Marco de sucesso do mês</Text>
                <Text style={S.phaseMilestoneValue}>{plan.phaseSummaries[phase.key].milestone}</Text>
              </View>
              {plan.plan90Days[phase.key].map((action, index) => (
                <ActionCard
                  key={index}
                  action={action}
                  companyName={companyName}
                  companyWebsite={companyWebsite}
                />
              ))}
            </View>
          ))}
        </View>

        {/* 5. Agenda semanal do gestor — lista única com divisórias, igual
            a weekly-agenda-section.tsx. */}
        {plan.weeklyManagerAgenda.length > 0 ? (
          <View wrap={false}>
            <Text style={S.sectionNumber}>05 · ROTINA</Text>
            <Text style={S.sectionTitle}>Agenda semanal do gestor</Text>
            <View style={S.agendaList}>
              {plan.weeklyManagerAgenda.slice(0, DAY_LABELS.length).map((item, index) => (
                <View key={index} style={index > 0 ? [S.agendaRow, S.agendaRowDivider] : S.agendaRow}>
                  <Text style={S.agendaDay}>{DAY_LABELS[index]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.agendaFocus}>{item.focus}</Text>
                    <Text style={S.agendaActivities}>{item.activities.join(", ")}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={S.hr} />

        {/* 6. Indicadores — grade 2 colunas com "atual → meta", igual a
            indicators-section.tsx. */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>06 · INDICADORES</Text>
          <Text style={S.sectionTitle}>Indicadores para acompanhar</Text>
          <View style={S.indicatorGrid}>
            {plan.indicators.map((indicator, index) => (
              <View key={index} style={S.indicatorCard}>
                <Text style={S.indicatorName}>{indicator.name}</Text>
                <Text style={S.indicatorValue}>
                  {indicator.currentValue ?? "—"}
                  {indicator.targetValue ? <Text style={S.indicatorTarget}>{`  → ${indicator.targetValue}`}</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. Palavras-chave de SEO (estimativas da IA) — tabela igual a
            seo-opportunities-section.tsx. */}
        {seoOpportunities.length > 0 ? (
          <>
            <View style={S.hr} />
            <View wrap={false}>
              <Text style={S.sectionNumber}>07 · OPORTUNIDADES</Text>
              <Text style={S.sectionTitle}>Palavras-chave para a sua empresa</Text>
              <Text style={S.sectionIntro}>
                Volumes estimados por IA para orientar a pauta. Não são números oficiais do Google.
                {hasSeoGap ? " Os temas marcados ainda não aparecem no site e representam nichos a explorar." : ""}
              </Text>
            </View>
            <View style={S.seoTable}>
              <View style={S.seoHeaderRow}>
                <Text style={[S.seoHeaderCell, S.seoColRank]}>#</Text>
                <Text style={[S.seoHeaderCell, { flex: 1 }]}>Palavra-chave</Text>
                <Text style={[S.seoHeaderCell, { width: 78 }]}>Buscas/mês (est.)</Text>
                <Text style={[S.seoHeaderCell, { width: 70 }]}>Concorrência</Text>
                <Text style={[S.seoHeaderCell, { width: 92 }]}>Status</Text>
              </View>
              {seoOpportunities.map((opportunity) => (
                <View key={opportunity.keyword} style={S.seoRow} wrap={false}>
                  <Text style={S.seoColRank}>{opportunity.opportunityRank}</Text>
                  <Text style={S.seoColKeyword}>{opportunity.keyword}</Text>
                  <Text style={S.seoColVolume}>
                    {opportunity.avgMonthlySearches !== null
                      ? `~${opportunity.avgMonthlySearches.toLocaleString("pt-BR")}`
                      : "Não disponível"}
                  </Text>
                  <View style={S.seoColCompetition}>
                    <Text style={[S.pill, COMPETITION_PILL[opportunity.competition]]}>
                      {COMPETITION_LABEL[opportunity.competition]}
                    </Text>
                  </View>
                  <View style={S.seoColStatus}>
                    {opportunity.coverageGap ? <Text style={[S.pill, NICHE_PILL]}>Nicho não explorado</Text> : null}
                  </View>
                </View>
              ))}
            </View>
            <View style={S.seoCtaBox} wrap={false}>
              <Text style={S.seoCtaText}>
                Quer transformar essas palavras-chave em um calendário de conteúdo que gera leads? Fale com um
                especialista em SEO da Job Content.
              </Text>
            </View>
          </>
        ) : null}

        <View style={S.hr} />

        {/* Limitações */}
        {plan.limitations.length > 0 ? (
          <View wrap={false}>
            <Text style={[S.sectionTitle, { fontSize: 11 }]}>
              O que considerar ao interpretar este diagnóstico
            </Text>
            {plan.limitations.map((limitation, index) => (
              <Text key={index} style={{ fontSize: 8.5, color: COLORS.muted, marginBottom: 2 }}>
                • {limitation}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={S.hr} />

        {/* CTA Job Content */}
        <View style={[S.card, { backgroundColor: COLORS.navy, borderWidth: 0 }]} wrap={false}>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.white, marginBottom: 6 }}>
            Seu plano mostra o que precisa mudar. Agora é hora de executar.
          </Text>
          <Text style={{ fontSize: 9, color: "#C7D0F0", lineHeight: 1.5 }}>
            A Job Content pode ajudar a transformar essas prioridades em processo, campanhas,
            automação, CRM e geração de oportunidades. Fale com um especialista.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function FunnelStageRow({ stage, isBiggestLeak }: { stage: ResultFunnelStage; isBiggestLeak: boolean }) {
  if (stage.uncalculable) {
    return (
      <View style={S.funnelStageRow} wrap={false}>
        <Text style={S.funnelStageLabel}>{stage.label}</Text>
        <Text style={{ fontSize: 8, color: COLORS.mutedLight, flex: 1 }}>
          Não foi possível calcular esta etapa com os dados disponíveis.
        </Text>
      </View>
    );
  }

  const max = Math.max(stage.current ?? 0, stage.required ?? 0, 1);
  const percent = Math.min(100, Math.round(((stage.current ?? 0) / max) * 100));

  return (
    <View
      style={isBiggestLeak ? [S.funnelStageRow, S.funnelStageRowHighlight] : S.funnelStageRow}
      wrap={false}
    >
      <View style={{ width: 90 }}>
        {isBiggestLeak ? <Text style={S.biggestLeakBadge}>Maior gargalo</Text> : null}
        <Text style={S.funnelStageLabel}>{stage.label}</Text>
      </View>
      <View style={S.funnelBarTrack}>
        <View
          style={[
            S.funnelBarFill,
            { width: `${percent}%` as unknown as number },
            isBiggestLeak ? { backgroundColor: COLORS.orange } : {},
          ]}
        />
      </View>
      <Text style={S.funnelStageNumbers}>
        Atual: {stage.current ?? "—"} · Necessário: {stage.required ?? "—"}
        {stage.gap !== null ? ` · Gap: ${stage.gap}` : ""}
      </Text>
    </View>
  );
}

/**
 * Resumo do planejamento estratégico no PDF — espelha
 * src/components/result/plan-strategic-summary.tsx. A distribuição de
 * verba é SEMPRE calculada aqui a partir da prioridade qualitativa (nunca
 * uma porcentagem vinda da IA, ver src/lib/plan-media-budget.ts).
 */
function StrategicSummaryBlock({ summary }: { summary: StrategicSummary }) {
  const budget: MediaBudgetSlice[] = computeMediaBudgetSplit(summary.mediaBudgetPriority);

  return (
    <View style={S.strategicCard} wrap={false}>
      <Text style={S.strategicHeadline}>{summary.headline}</Text>
      <View style={S.strategicTileGrid}>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Posicionamento</Text>
          <Text style={S.strategicTileBody}>{summary.positioning}</Text>
        </View>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Estratégia de canais</Text>
          <Text style={S.strategicTileBody}>{summary.channelStrategy}</Text>
        </View>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Jornada de conteúdo</Text>
          <Text style={S.strategicTileBody}>{summary.contentJourney}</Text>
        </View>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Processo comercial</Text>
          <Text style={S.strategicTileBody}>{summary.commercialProcess}</Text>
        </View>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Premissas</Text>
          <Text style={S.strategicTileBody}>{summary.premises}</Text>
        </View>
        <View style={S.strategicTile}>
          <Text style={S.strategicTileLabel}>Distribuição de verba de mídia</Text>
          <View style={S.budgetBarTrack}>
            {budget.map((slice, index) => (
              <View
                key={slice.channel}
                style={{
                  width: `${slice.percent}%` as unknown as number,
                  backgroundColor: BUDGET_SLICE_COLOR[index % BUDGET_SLICE_COLOR.length],
                }}
              />
            ))}
          </View>
          <View style={S.budgetLegendRow}>
            {budget.map((slice) => (
              <Text key={slice.channel} style={S.budgetLegendText}>
                {slice.channel} {slice.percent}% ({MEDIA_PRIORITY_LABEL[slice.priority]})
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Cronograma das frentes no PDF — espelha
 * src/components/result/plan-cronograma.tsx: uma linha por frente, uma
 * célula por mês com a contagem de ações (colorida com a cor da fase),
 * tudo derivado de buildPlanFronts (src/lib/plan-timeline.ts).
 */
function FrontsMatrixBlock({ fronts }: { fronts: PlanFront[] }) {
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={[S.cardTitle, { marginBottom: 6 }]}>Cronograma das frentes</Text>
      <View style={S.frontLegendRow}>
        {PLAN_MONTHS.map((month) => (
          <View key={month.key} style={S.frontLegendItem}>
            <View style={[S.frontLegendDot, { backgroundColor: month.color }]} />
            <Text style={S.frontLegendText}>{month.name}</Text>
          </View>
        ))}
      </View>
      {fronts.map((front) => (
        <View key={front.actionType} style={S.frontRow}>
          <Text style={S.frontLabel}>{front.label}</Text>
          {front.cells.map((cell, index) => {
            const month = PLAN_MONTHS[index];
            return (
              <View
                key={month.key}
                style={[S.frontCell, cell.actions.length > 0 ? { backgroundColor: month.color } : {}]}
              >
                {cell.actions.length > 0 ? (
                  <Text style={S.frontCellFilled}>
                    {cell.actions.length} {cell.actions.length === 1 ? "ação" : "ações"}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Desenvolvimento completo de blog/material rico/anúncio no PDF — mesmo
 * conteúdo do `<details>` da tela (ver BlogBriefDetails/etc. em
 * plan-90-days-section.tsx), sempre visível aqui porque papel não expande:
 * um documento estático não tem como esconder atrás de um clique.
 */
function BlogBriefBlock({ brief }: { brief: BlogBrief }) {
  return (
    <View style={S.contentBriefBox}>
      <Text style={S.contentBriefHeading}>Desenvolvimento do post</Text>
      <Text style={S.contentBriefSubtitle}>{brief.subtitle}</Text>
      {brief.sections.map((section, index) => (
        <View key={index} style={{ marginTop: 4 }}>
          <Text style={S.contentBriefItemTitle}>{section.heading}</Text>
          <Text style={S.contentBriefItemBody}>{section.body}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Material rico no PDF — mesma capa padrão da tela (plan-content-mockup.tsx:
 * navy com lombada laranja, formato, título real e nome REAL da empresa)
 * ao lado do sumário, num painel branco sobre a cor da fase.
 */
function RichMaterialBriefBlock({
  brief,
  title,
  companyName,
}: {
  brief: RichMaterialBrief;
  title: string;
  companyName: string;
}) {
  return (
    <View style={S.mockPanel} wrap={false}>
      <Text style={S.mockLabel}>Material rico do mês</Text>
      <View style={S.materialRow}>
        <View style={S.materialCover}>
          <Text style={S.materialCoverEyebrow}>{brief.format}</Text>
          <Text style={S.materialCoverTitle}>{title}</Text>
          <Text style={S.materialCoverCompany}>{companyName}</Text>
        </View>
        <View style={S.materialTextCol}>
          <Text style={S.materialEyebrow}>Material rico · {brief.format}</Text>
          <Text style={S.materialTitle}>{title}</Text>
          <Text style={S.materialSubtitle}>{brief.subtitle}</Text>
          {brief.sections.map((section, index) => (
            <View key={index} style={S.materialSectionRow}>
              <Text style={S.materialSectionNumber}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.materialSectionTitle}>{section.title}</Text>
                <Text style={S.materialSectionBody}>{section.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <Text style={S.materialCoverIdea}>
        <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.text }}>Ideia visual para o mockup: </Text>
        {brief.coverIdea}
      </Text>
    </View>
  );
}

/**
 * Anúncio no PDF — simulação do feed do Meta Ads, igual a
 * PaidTrafficShowcase na tela: inicial + nome real da empresa,
 * "Patrocinado", criativo escuro e rodapé com o domínio real (some quando
 * a empresa não informou site, nunca inventa um).
 */
function PaidTrafficBriefBlock({
  brief,
  companyName,
  companyWebsite,
}: {
  brief: PaidTrafficBrief;
  companyName: string;
  companyWebsite: string | null;
}) {
  return (
    <View style={S.mockPanel} wrap={false}>
      <Text style={S.mockLabel}>Anúncio para Meta Ads</Text>
      <View style={S.adCard}>
        <View style={S.adHeader}>
          <View style={S.adAvatar}>
            <Text style={S.adAvatarText}>{companyName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={S.adCompany}>{companyName}</Text>
            <Text style={S.adSponsored}>Patrocinado</Text>
          </View>
        </View>
        <Text style={S.adPrimaryText}>{brief.primaryText}</Text>
        <View style={S.adCreative}>
          <View style={S.adAccent} />
          <Text style={S.adHeadline}>{brief.headline}</Text>
          <Text style={S.adSubheadline}>{brief.subheadline}</Text>
        </View>
        <View style={S.adFooter}>
          <View style={{ flex: 1 }}>
            {companyWebsite ? <Text style={S.adDomain}>{companyWebsite}</Text> : null}
            <Text style={S.adFooterHeadline}>{brief.headline}</Text>
          </View>
          <Text style={S.adCta}>{brief.ctaText}</Text>
        </View>
      </View>
    </View>
  );
}

/** Cadência de 5 dias — mesma estrutura da tela (canais + objetivo por dia), nunca copy. */
function CadenceBriefBlock({ brief }: { brief: CadenceBrief }) {
  return (
    <View style={S.contentBriefBox} wrap={false}>
      <Text style={S.contentBriefHeading}>Cadência de 5 dias</Text>
      {brief.days.map((day, index) => (
        <Text key={index} style={[S.contentBriefItemBody, { marginTop: 3 }]}>
          <Text style={S.contentBriefItemTitle}>
            {cadenceDayLabel(index)} · {cadenceChannelsLabel(day)}
          </Text>
          {` — ${day.goal}`}
        </Text>
      ))}
    </View>
  );
}

/** Passo a passo de como montar o playbook — mesmo conteúdo da tela. */
function PlaybookBriefBlock({ brief }: { brief: PlaybookBrief }) {
  return (
    <View style={S.contentBriefBox}>
      <Text style={S.contentBriefHeading}>Como montar o playbook</Text>
      {brief.steps.map((step, index) => (
        <View key={index} style={{ marginTop: 4 }} wrap={false}>
          <Text style={S.contentBriefItemTitle}>
            {index + 1}. {step.title}
          </Text>
          <Text style={S.contentBriefItemBody}>{step.howTo}</Text>
        </View>
      ))}
      <Text style={[S.contentBriefItemBody, { marginTop: 5 }]}>
        <Text style={S.contentBriefItemTitle}>Para manter vivo: </Text>
        {brief.adoptionTip}
      </Text>
    </View>
  );
}

/**
 * Landing page no PDF — simulação do hero igual a LandingPageShowcase na
 * tela: 3 blocos de resumo, navegador com domínio real + URL sugerida e o
 * formulário real desenhado dentro do hero. As seções abaixo do hero
 * continuam como texto, na cor da fase.
 */
function LandingPageBriefBlock({
  brief,
  companyWebsite,
}: {
  brief: LandingPageBrief;
  companyWebsite: string | null;
}) {
  const addressBarPath = companyWebsite ? `${companyWebsite}${brief.url}` : brief.url;

  return (
    <>
      <View style={S.mockPanel} wrap={false}>
        <Text style={S.mockLabel}>Landing page do mês · sugestão de hero</Text>
        <View style={S.lpInfoRow}>
          <View style={S.lpInfoTile}>
            <Text style={S.lpInfoLabel}>Landing page</Text>
            <Text style={S.lpInfoValue}>{brief.name}</Text>
          </View>
          <View style={S.lpInfoTile}>
            <Text style={S.lpInfoLabel}>URL sugerida</Text>
            <Text style={S.lpInfoValue}>{brief.url}</Text>
          </View>
          <View style={S.lpInfoTile}>
            <Text style={S.lpInfoLabel}>Objetivo</Text>
            <Text style={S.lpInfoValue}>{brief.goal}</Text>
          </View>
        </View>
        <View style={S.lpBrowser}>
          <View style={S.lpBrowserBar}>
            <View style={S.lpDot} />
            <View style={S.lpDot} />
            <View style={S.lpDot} />
            <Text style={S.lpAddress}>{addressBarPath}</Text>
          </View>
          <View style={S.lpHero}>
            <View style={S.lpHeroText}>
              <Text style={S.lpHeroEyebrow}>Hero · Primeira dobra</Text>
              <Text style={S.lpHeroHeadline}>{brief.heroHeadline}</Text>
              <Text style={S.lpHeroSub}>{brief.heroSubheadline}</Text>
            </View>
            <View style={S.lpForm}>
              <Text style={S.lpFormLabel}>Campos do formulário</Text>
              {brief.formFields.map((field, index) => (
                <Text key={index} style={S.lpField}>
                  {field}
                </Text>
              ))}
              <Text style={S.lpButton}>{brief.buttonText}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={S.contentBriefBox}>
        <Text style={S.contentBriefHeading}>Seções da página abaixo do hero</Text>
        {brief.sections.map((section, index) => (
          <View key={index} style={{ marginTop: 4 }}>
            <Text style={S.contentBriefItemTitle}>
              {index + 1}. {section.title}
            </Text>
            <Text style={S.contentBriefItemBody}>{section.description}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

/**
 * Cartão de ação dentro de uma fase colorida do plano de 90 dias — texto
 * branco (mesmo padrão da tela, ver plan-90-days-section.tsx). O selo do
 * tipo de ação usa a cor de ACTION_TYPE_COLOR como texto sobre um fundo
 * branco, pra ficar legível em qualquer uma das 3 cores de fase.
 *
 * Sem wrap={false} aqui: uma ação de conteúdo com brief completo (post
 * com 4 seções, ebook com 8 capítulos) pode facilmente passar de uma
 * página — forçar tudo numa página só (como antes) cortaria ou empurraria
 * o cartão inteiro pra próxima página em branco.
 */
function ActionCard({
  action,
  companyName,
  companyWebsite,
}: {
  action: PlanAction;
  companyName: string;
  companyWebsite: string | null;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[S.actionTypeBadge, { color: ACTION_TYPE_COLOR[action.actionType] }]}>
        {ACTION_TYPE_LABEL[action.actionType]}
      </Text>
      <Text style={S.phaseActionTitle}>{action.title}</Text>
      <Text style={S.phaseActionBody}>{action.objective}</Text>
      {action.details.map((detail, index) => (
        <Text key={index} style={S.phaseActionDetail}>
          • {detail}
        </Text>
      ))}
      {action.blogBrief ? <BlogBriefBlock brief={action.blogBrief} /> : null}
      {action.richMaterialBrief ? (
        <RichMaterialBriefBlock brief={action.richMaterialBrief} title={action.title} companyName={companyName} />
      ) : null}
      {action.paidTrafficBrief ? (
        <PaidTrafficBriefBlock
          brief={action.paidTrafficBrief}
          companyName={companyName}
          companyWebsite={companyWebsite}
        />
      ) : null}
      {action.playbookBrief ? <PlaybookBriefBlock brief={action.playbookBrief} /> : null}
      {action.cadenceBrief ? <CadenceBriefBlock brief={action.cadenceBrief} /> : null}
      {action.landingPageBrief ? (
        <LandingPageBriefBlock brief={action.landingPageBrief} companyWebsite={companyWebsite} />
      ) : null}
      <View style={S.cardMetaRow}>
        <View>
          <Text style={S.phaseActionMetaLabel}>Responsável</Text>
          <Text style={S.phaseActionMetaValue}>{action.suggestedOwner}</Text>
        </View>
        <View>
          <Text style={S.phaseActionMetaLabel}>Prazo</Text>
          <Text style={S.phaseActionMetaValue}>{action.deadline}</Text>
        </View>
        <View>
          <Text style={S.phaseActionMetaLabel}>Indicador</Text>
          <Text style={S.phaseActionMetaValue}>{action.indicator}</Text>
        </View>
      </View>
      <View style={S.phaseActionCriteria}>
        <Text style={{ fontSize: 8, color: COLORS.white }}>Conclusão: {action.completionCriteria}</Text>
      </View>
    </View>
  );
}
