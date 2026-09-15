import { Document, Page, Text, View } from "@react-pdf/renderer";

import { dimensionLabel } from "@/components/result/dimension-labels";
import { COLORS, PDF_STYLES as S } from "@/lib/pdf/commercial-plan-pdf-styles";
import type { KeywordOpportunity } from "@/lib/seo/keyword-coverage";
import type { Competition } from "@/lib/seo/keyword-opportunity";
import type { CommercialPlan, PlanAction } from "@/schemas/commercial-plan";
import type { ResultFunnelStage } from "@/server/get-commercial-plan-result";
import type { ConfidenceLevel, Dimension } from "@/types/tables";

/** Bump ao alterar o layout/conteúdo do PDF — invalida o cache mesmo com o mesmo plano (ver src/server/generate-commercial-plan-pdf.ts). */
export const PDF_TEMPLATE_VERSION = "commercial-plan-pdf-v5";

export type CommercialPlanDocumentProps = {
  companyName: string;
  generatedAt: string;
  plan: CommercialPlan;
  funnelStages: ResultFunnelStage[];
  primaryBottleneck: Dimension | null;
  secondaryRisk: Dimension | null;
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

const DAY_LABELS = ["Segunda", "Quarta", "Sexta"] as const;

const PHASES: { key: keyof CommercialPlan["plan90Days"]; range: string; label: string }[] = [
  { key: "days1to30", range: "Dias 1–30", label: "Corrigir / Estruturar" },
  { key: "days31to60", range: "Dias 31–60", label: "Validar / Ativar" },
  { key: "days61to90", range: "Dias 61–90", label: "Escalar / Otimizar" },
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
  secondaryRisk,
  dataQualityPercentage,
  confidence,
  seoOpportunities,
}: CommercialPlanDocumentProps) {
  const isInboundApplicable = primaryBottleneck === "demand" || secondaryRisk === "demand";

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

          <View style={S.coverStatsRow}>
            <View style={S.coverStatBox}>
              <Text style={S.coverStatLabel}>Qualidade dos dados</Text>
              <Text style={S.coverStatValue}>
                {dataQualityPercentage !== null ? `${dataQualityPercentage}%` : "—"}
              </Text>
            </View>
            <View style={S.coverStatBox}>
              <Text style={S.coverStatLabel}>Confiança</Text>
              <Text style={S.coverStatValue}>{confidence ? CONFIDENCE_LABEL[confidence] : "—"}</Text>
            </View>
          </View>
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

        {/* 2. Principal gargalo */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>02</Text>
          <Text style={S.sectionTitle}>Principal gargalo</Text>
          <View style={S.row}>
            <View style={[S.card, S.col]}>
              <Text style={S.cardMetaLabel}>Gargalo principal</Text>
              <Text style={[S.cardTitle, { color: COLORS.blue, marginTop: 2 }]}>
                {dimensionLabel(primaryBottleneck)}
              </Text>
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

        {/* 3. Mapa de Gargalos Comerciais */}
        <View>
          <Text style={S.sectionNumber}>03</Text>
          <Text style={S.sectionTitle}>Mapa de gargalos comerciais</Text>
          {funnelStages.map((stage) => (
            <FunnelStageRow key={stage.key} stage={stage} />
          ))}
        </View>

        <View style={S.hr} />

        {/* 4. Cenário atual versus necessário */}
        <BiggestLeakSection funnelStages={funnelStages} />

        <View style={S.hr} />

        {/* 5. Causa-raiz */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>05</Text>
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

        {/* 6. Três prioridades */}
        <View>
          <Text style={S.sectionNumber}>06</Text>
          <Text style={S.sectionTitle}>Três prioridades</Text>
          {plan.priorities.map((priority, index) => (
            <View key={index} style={S.card} wrap={false}>
              <Text style={S.priorityNumber}>{String(index + 1).padStart(2, "0")}</Text>
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

        {/* 7. Plano de ação de 90 dias */}
        <View>
          <Text style={S.sectionNumber}>07</Text>
          <Text style={S.sectionTitle}>Plano de ação de 90 dias</Text>
          {PHASES.map((phase) => (
            <View key={phase.key} style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontSize: 9.5,
                  fontFamily: "Helvetica-Bold",
                  color: COLORS.navy,
                  marginBottom: 6,
                }}
              >
                {phase.range} — {phase.label}
              </Text>
              {plan.plan90Days[phase.key].map((action, index) => (
                <ActionCard key={index} action={action} />
              ))}
            </View>
          ))}
        </View>

        {/* 8. Inbound Marketing (só quando aplicável) */}
        {isInboundApplicable ? (
          <>
            <View style={S.hr} />
            <View wrap={false}>
              <Text style={S.sectionNumber}>08</Text>
              <Text style={S.sectionTitle}>Ações de Inbound Marketing</Text>
              <Text style={S.sectionIntro}>
                Atrair → Converter → Nutrir → Qualificar → Gerar oportunidade — as ações do plano
                de 90 dias acima atacam o ponto onde essa jornada está travando.
              </Text>
            </View>
          </>
        ) : null}

        <View style={S.hr} />

        {/* 9. Agenda semanal do gestor */}
        {plan.weeklyManagerAgenda.length > 0 ? (
          <View wrap={false}>
            <Text style={S.sectionNumber}>09</Text>
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

        {/* 10. Indicadores */}
        <View wrap={false}>
          <Text style={S.sectionNumber}>10</Text>
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

        {/* 11. Oportunidades de SEO (sugestões e estimativas geradas por IA) */}
        {seoOpportunities.length > 0 ? (
          <>
            <View style={S.hr} />
            <View wrap={false}>
              <Text style={S.sectionNumber}>11</Text>
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
                  · {COMPETITION_LABEL[opportunity.competition]}
                  {opportunity.coverageGap ? " · Oportunidade de nicho não explorada" : ""}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <View style={S.hr} />

        {/* 12. Limitações */}
        {plan.limitations.length > 0 ? (
          <View wrap={false}>
            <Text style={S.sectionNumber}>12</Text>
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

        {/* 13. CTA Job Content */}
        <View style={[S.card, { backgroundColor: COLORS.navy, borderWidth: 0 }]} wrap={false}>
          <Text style={S.sectionNumber}>13</Text>
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

function FunnelStageRow({ stage }: { stage: ResultFunnelStage }) {
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
    <View style={S.funnelStageRow} wrap={false}>
      <Text style={S.funnelStageLabel}>{stage.label}</Text>
      <View style={S.funnelBarTrack}>
        <View style={[S.funnelBarFill, { width: `${percent}%` as unknown as number }]} />
      </View>
      <Text style={S.funnelStageNumbers}>
        Atual: {stage.current ?? "—"} · Necessário: {stage.required ?? "—"}
        {stage.gap !== null ? ` · Gap: ${stage.gap}` : ""}
      </Text>
    </View>
  );
}

function BiggestLeakSection({ funnelStages }: { funnelStages: ResultFunnelStage[] }) {
  const calculable = funnelStages.filter((stage) => !stage.uncalculable && stage.gap !== null);
  const biggest =
    calculable.length > 0
      ? calculable.reduce((worst, stage) => ((stage.gap ?? 0) > (worst.gap ?? 0) ? stage : worst))
      : null;

  return (
    <View wrap={false}>
      <Text style={S.sectionNumber}>04</Text>
      <Text style={S.sectionTitle}>Cenário atual versus necessário</Text>
      {biggest ? (
        <View style={[S.card, { borderColor: COLORS.danger, borderWidth: 1 }]}>
          <Text style={S.cardMetaLabel}>Maior gargalo identificado</Text>
          <Text style={[S.cardTitle, { color: COLORS.danger, fontSize: 12, marginTop: 2 }]}>
            {biggest.label}
          </Text>
          <Text style={S.cardBody}>
            Atual: {biggest.current ?? "—"} · Necessário: {biggest.required ?? "—"} · Gap: {biggest.gap}
          </Text>
        </View>
      ) : (
        <Text style={S.cardBody}>
          Não foi possível calcular um cenário atual versus necessário com os dados disponíveis.
        </Text>
      )}
    </View>
  );
}

function ActionCard({ action }: { action: PlanAction }) {
  return (
    <View style={[S.card, { borderLeftWidth: 2, borderLeftColor: COLORS.blue }]} wrap={false}>
      <Text style={S.cardTitle}>{action.title}</Text>
      <Text style={S.cardBody}>{action.objective}</Text>
      <View style={S.cardMetaRow}>
        <View>
          <Text style={S.cardMetaLabel}>Responsável</Text>
          <Text style={S.cardMetaValue}>{action.suggestedOwner}</Text>
        </View>
        <View>
          <Text style={S.cardMetaLabel}>Prazo</Text>
          <Text style={S.cardMetaValue}>{action.deadline}</Text>
        </View>
        <View>
          <Text style={S.cardMetaLabel}>Indicador</Text>
          <Text style={S.cardMetaValue}>{action.indicator}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, color: COLORS.mutedLight, marginTop: 4 }}>
        Conclusão: {action.completionCriteria}
      </Text>
    </View>
  );
}
