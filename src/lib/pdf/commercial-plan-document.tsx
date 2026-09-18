import { Document, Page, Text, View } from "@react-pdf/renderer";

import { dimensionLabel } from "@/components/result/dimension-labels";
import { COLORS, PDF_STYLES as S } from "@/lib/pdf/commercial-plan-pdf-styles";
import { ACTION_TYPE_COLOR, ACTION_TYPE_LABEL } from "@/lib/plan-action-types";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import type { Competition } from "@/lib/seo/keyword-opportunity";
import type {
  BlogBrief,
  CadenceBrief,
  CommercialPlan,
  PaidTrafficBrief,
  PlanAction,
  RichMaterialBrief,
} from "@/schemas/commercial-plan";
import type { ResultFunnelStage } from "@/server/get-commercial-plan-result";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

/** Bump ao alterar o layout/conteúdo do PDF — invalida o cache mesmo com o mesmo plano (ver src/server/generate-commercial-plan-pdf.ts). */
export const PDF_TEMPLATE_VERSION = "commercial-plan-pdf-v12";

export type CommercialPlanDocumentProps = {
  companyName: string;
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

const COMPETITION_LABEL: Record<Competition, string> = {
  low: "Concorrência baixa",
  medium: "Concorrência média",
  high: "Concorrência alta",
  unknown: "Concorrência não informada",
};

/** Baixa concorrência = boa oportunidade (verde); alta = atenção (laranja) — mesma leitura da tela. */
const COMPETITION_COLOR: Record<Competition, string> = {
  low: COLORS.success,
  medium: COLORS.muted,
  high: COLORS.orange,
  unknown: COLORS.mutedLight,
};

const DAY_LABELS = ["Segunda", "Quarta", "Sexta"] as const;

/** Mesmo esquema de cores de src/components/result/priorities-section.tsx (NUMBER_GRADIENT). */
const PRIORITY_NUMBER_COLOR = [COLORS.blue, COLORS.orange, COLORS.orangeDeep];

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

        {/* 1. Diagnóstico executivo */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>01</Text>
          <Text style={S.sectionTitle}>Diagnóstico executivo</Text>
          <Text style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.6, marginBottom: 4 }}>
            {plan.executiveDiagnosis}
          </Text>
        </View>

        <View style={S.hr} />

        {/* 2. Principal gargalo — 3 cartões coloridos, espelhando
            exatamente hero-section.tsx (mesmas cores de borda/valor). */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>02</Text>
          <Text style={S.sectionTitle}>Principal gargalo</Text>
          <View style={S.heroStatRow}>
            <View style={[S.heroStatCard, { borderTopColor: COLORS.blue }]}>
              <Text style={S.heroStatLabel}>Principal gargalo</Text>
              <Text style={[S.heroStatValue, { color: COLORS.orange }]}>
                {dimensionLabel(primaryBottleneck)}
              </Text>
            </View>
            <View style={[S.heroStatCard, { borderTopColor: COLORS.blue }]}>
              <Text style={S.heroStatLabel}>Qualidade dos dados</Text>
              <Text style={[S.heroStatValue, { color: COLORS.blue }]}>
                {dataQualityPercentage !== null ? `${dataQualityPercentage}%` : "—"}
              </Text>
            </View>
            <View style={[S.heroStatCard, { borderTopColor: COLORS.orange }]}>
              <Text style={S.heroStatLabel}>Confiança do diagnóstico</Text>
              <Text style={S.heroStatValue}>{confidence ? CONFIDENCE_LABEL[confidence] : "—"}</Text>
            </View>
          </View>
          {plan.evidence.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {plan.evidence.slice(0, 5).map((item, index) => (
                <Text key={index} style={{ fontSize: 8.5, color: COLORS.muted, marginBottom: 2 }}>
                  • {item.summary}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={S.hr} />

        {/* 3. Mapa de Gargalos Comerciais — a etapa com maior gap é
            destacada em laranja (borda + barra), igual ao selo "Maior
            gargalo" da tela (funnel-leak-map.tsx) — sem seção separada
            de "cenário atual x necessário": aqui já é a mesma informação. */}
        <View>
          <Text style={S.sectionNumber}>03</Text>
          <Text style={S.sectionTitle}>Mapa de gargalos comerciais</Text>
          {funnelStages.map((stage) => (
            <FunnelStageRow key={stage.key} stage={stage} isBiggestLeak={stage.key === biggestLeakKey} />
          ))}
        </View>

        <View style={S.hr} />

        {/* 4. Causa-raiz */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>04</Text>
          <Text style={S.sectionTitle}>Causa-raiz</Text>
          <View style={S.card}>
            <Text style={{ fontSize: 10, color: COLORS.text, lineHeight: 1.5 }}>
              {plan.rootCause.description}
            </Text>
          </View>
          {plan.rootCause.evidence.map((item, index) => (
            <Text key={index} style={{ fontSize: 8.5, color: COLORS.muted, marginBottom: 2 }}>
              {index + 1}. {item.summary}
            </Text>
          ))}
        </View>

        <View style={S.hr} />

        {/* 5. Três prioridades — número colorido por índice, mesmo
            esquema de priorities-section.tsx (azul, laranja, laranja
            escuro). */}
        <View>
          <Text style={S.sectionNumber}>05</Text>
          <Text style={S.sectionTitle}>Três prioridades</Text>
          {plan.priorities.map((priority, index) => (
            <View key={index} style={S.card} wrap={false}>
              <Text style={[S.priorityNumber, { color: PRIORITY_NUMBER_COLOR[index % PRIORITY_NUMBER_COLOR.length] }]}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text style={S.cardTitle}>{priority.title}</Text>
              <Text style={S.cardBody}>{priority.rationale}</Text>
              <View style={S.cardMetaRow}>
                <View>
                  <Text style={S.cardMetaLabel}>Impacto esperado</Text>
                  <Text style={S.cardMetaValue}>{priority.expectedImpact}</Text>
                </View>
                <View>
                  <Text style={S.cardMetaLabel}>Indicador</Text>
                  <Text style={S.cardMetaValue}>{priority.primaryIndicator}</Text>
                </View>
                <View>
                  <Text style={S.cardMetaLabel}>Prazo</Text>
                  <Text style={S.cardMetaValue}>{priority.timeframe}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={S.hr} />

        {/* 6. Plano de ação de 90 dias — cada fase com a cor da marca
            (navy/azul/laranja), espelhando a tela de resultado. */}
        <View>
          <Text style={S.sectionNumber}>06</Text>
          <Text style={S.sectionTitle}>Plano de ação de 90 dias</Text>
          {PHASES.map((phase) => (
            // Sem wrap={false} aqui de propósito: uma fase pode ter até 5
            // ações e não cabe garantir que tudo isso caiba numa página só
            // — cada ActionCard individual é que não quebra no meio
            // (wrap={false} dentro dela).
            <View key={phase.key} style={[S.phaseCard, { backgroundColor: phase.color }]}>
              <Text style={S.phaseHeader}>
                {phase.range} — {phase.label}
              </Text>
              {plan.plan90Days[phase.key].map((action, index) => (
                <ActionCard key={index} action={action} />
              ))}
            </View>
          ))}
        </View>

        {/* 7. Agenda semanal do gestor */}
        {plan.weeklyManagerAgenda.length > 0 ? (
          <View wrap={false}>
            <Text style={S.sectionNumber}>07</Text>
            <Text style={S.sectionTitle}>Agenda semanal do gestor</Text>
            <View style={S.row}>
              {plan.weeklyManagerAgenda.slice(0, 3).map((item, index) => (
                <View key={index} style={[S.card, S.col]}>
                  <Text style={[S.cardMetaLabel, { color: COLORS.blue }]}>{DAY_LABELS[index]}</Text>
                  <Text style={[S.cardTitle, { marginTop: 2 }]}>{item.focus}</Text>
                  {item.activities.map((activity, activityIndex) => (
                    <Text key={activityIndex} style={{ fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
                      • {activity}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={S.hr} />

        {/* 8. Indicadores */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>08</Text>
          <Text style={S.sectionTitle}>Indicadores para acompanhar</Text>
          {plan.indicators.map((indicator, index) => (
            <View key={index} style={S.funnelStageRow}>
              <Text style={[S.funnelStageLabel, { width: 160 }]}>{indicator.name}</Text>
              <Text style={{ fontSize: 8.5, color: COLORS.text, flex: 1 }}>
                {indicator.currentValue ?? "—"}
                {indicator.targetValue ? ` → meta: ${indicator.targetValue}` : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* 9. Oportunidades de SEO (sugestões e estimativas geradas por IA) */}
        {seoOpportunities.length > 0 ? (
          <>
            <View style={S.hr} />
            <View wrap={false}>
              <Text style={S.sectionNumber}>09</Text>
              <Text style={S.sectionTitle}>Oportunidades para a sua empresa</Text>
              <Text style={S.sectionIntro}>
                Palavras-chave sugeridas pela IA, com estimativa de volume de busca e
                concorrência — não são números reais do Google, servem como direção.
              </Text>
            </View>
            {seoOpportunities.map((opportunity) => (
              <View key={opportunity.keyword} style={S.funnelStageRow} wrap={false}>
                <Text style={[S.funnelStageLabel, { width: 160 }]}>
                  #{opportunity.opportunityRank} {opportunity.keyword}
                </Text>
                <Text style={{ fontSize: 8.5, color: COLORS.text, flex: 1 }}>
                  {opportunity.avgMonthlySearches !== null
                    ? `~${opportunity.avgMonthlySearches.toLocaleString("pt-BR")} buscas/mês (estimativa)`
                    : "Volume não disponível"}{" "}
                  ·{" "}
                  <Text style={{ color: COMPETITION_COLOR[opportunity.competition], fontFamily: "Helvetica-Bold" }}>
                    {COMPETITION_LABEL[opportunity.competition]}
                  </Text>
                  {opportunity.coverageGap ? " · Oportunidade de nicho não explorada" : ""}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <View style={S.hr} />

        {/* 10. Limitações */}
        {plan.limitations.length > 0 ? (
          <View wrap={false}>
            <Text style={S.sectionNumber}>10</Text>
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

        {/* 11. CTA Job Content */}
        <View style={[S.card, { backgroundColor: COLORS.navy, borderWidth: 0 }]} wrap={false}>
          <Text style={S.sectionNumber}>11</Text>
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
            isBiggestLeak ? { backgroundColor: COLORS.orange } : null,
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

function RichMaterialBriefBlock({ brief }: { brief: RichMaterialBrief }) {
  return (
    <View style={S.contentBriefBox}>
      <Text style={S.contentBriefHeading}>Sumário do material ({brief.format})</Text>
      <Text style={S.contentBriefSubtitle}>{brief.subtitle}</Text>
      {brief.sections.map((section, index) => (
        <View key={index} style={{ marginTop: 4 }}>
          <Text style={S.contentBriefItemTitle}>
            {index + 1}. {section.title}
          </Text>
          <Text style={S.contentBriefItemBody}>{section.description}</Text>
        </View>
      ))}
      <View style={{ marginTop: 4 }}>
        <Text style={S.contentBriefItemTitle}>Ideia de capa</Text>
        <Text style={S.contentBriefItemBody}>{brief.coverIdea}</Text>
      </View>
    </View>
  );
}

function PaidTrafficBriefBlock({ brief }: { brief: PaidTrafficBrief }) {
  return (
    <View style={S.contentBriefBox}>
      <Text style={S.contentBriefHeading}>Copy do anúncio</Text>
      <View style={{ marginTop: 4 }}>
        <Text style={S.contentBriefItemTitle}>{brief.headline}</Text>
        <Text style={S.contentBriefItemBody}>{brief.subheadline}</Text>
      </View>
    </View>
  );
}

function CadenceBriefBlock({ brief }: { brief: CadenceBrief }) {
  return (
    <View style={S.contentBriefBox}>
      <Text style={S.contentBriefHeading}>Copy da cadência</Text>
      {brief.touchpoints.map((touchpoint, index) => (
        <View key={index} style={{ marginTop: 4 }}>
          <Text style={S.contentBriefItemTitle}>
            {touchpoint.moment} · {touchpoint.channel}
          </Text>
          <Text style={S.contentBriefItemBody}>{touchpoint.copy}</Text>
        </View>
      ))}
    </View>
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
function ActionCard({ action }: { action: PlanAction }) {
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
      {action.richMaterialBrief ? <RichMaterialBriefBlock brief={action.richMaterialBrief} /> : null}
      {action.paidTrafficBrief ? <PaidTrafficBriefBlock brief={action.paidTrafficBrief} /> : null}
      {action.cadenceBrief ? <CadenceBriefBlock brief={action.cadenceBrief} /> : null}
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
