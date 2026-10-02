import { StyleSheet } from "@react-pdf/renderer";

/**
 * Cores da Job Content. Navy + azul são as "oficiais" originais; laranja
 * foi acrescentado depois (pedido explícito: o PDF precisa se parecer
 * mais com a tela, que já usa azul/laranja como identidade visual) — o
 * resto da paleta continua neutro (cinza/branco), pra não virar
 * "colorido demais" e ainda ficar executivo/legível.
 */
export const COLORS = {
  navy: "#0C1D49",
  blue: "#153CA3",
  /** Laranja da marca (mesmo tom do degradê usado na tela, fase 3 do plano de 90 dias) — único acréscimo à paleta "executiva" original, usado só nas 3 fases do plano e nos tipos de ação, para o PDF ficar mais próximo visualmente da tela sem virar "colorido demais". */
  orange: "#F97925",
  /** Laranja mais escuro (--brand-orange-deep na tela) — usado no número da 3ª prioridade, mesmo degradê aproximado do priorities-section.tsx. */
  orangeDeep: "#FF6600",
  text: "#1A1E2B",
  muted: "#5B6478",
  mutedLight: "#8890A3",
  border: "#E2E5EC",
  bgLight: "#F5F6FA",
  white: "#FFFFFF",
  danger: "#B3261E",
  success: "#1E7B45",
} as const;

/**
 * Só as fontes padrão do PDF (Helvetica) — nenhum arquivo de fonte
 * embutido. Zero peso extra, e cobrem acentuação em português (encoding
 * WinAnsi padrão do PDF inclui Latin-1, que cobre á/ã/ç/é/etc.).
 */
export const PDF_STYLES = StyleSheet.create({
  // ─── Página ──────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: COLORS.navy,
    color: COLORS.white,
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 48,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  contentPage: {
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // ─── Capa ────────────────────────────────────────────────────────────────
  coverBrand: {
    fontSize: 11,
    color: "#AEB9E0",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    lineHeight: 1.25,
    marginTop: 16,
    marginBottom: 10,
  },
  coverCompany: {
    fontSize: 16,
    color: "#C7D0F0",
    marginBottom: 40,
  },
  coverFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 14,
  },
  coverFooterText: {
    fontSize: 8.5,
    color: "#AEB9E0",
  },

  // ─── Cartões de destaque (Gargalo/Leads/Qualidade/Confiança) — espelha
  // src/components/result/hero-section.tsx (4 cartões brancos, valor
  // colorido inline por card). ─────────────────────────────────────────
  heroStatRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  heroStatSuffix: {
    fontSize: 7.5,
    color: COLORS.muted,
    marginTop: 2,
  },
  heroStatLabel: {
    fontSize: 7.5,
    color: COLORS.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },

  // ─── Cabeçalho/rodapé fixos (páginas de conteúdo) ──────────────────────────
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageHeaderBrand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },
  pageHeaderCompany: {
    fontSize: 8.5,
    color: COLORS.muted,
  },
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 40,
    right: 40,
    height: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageFooterText: {
    fontSize: 8,
    color: COLORS.mutedLight,
  },

  // ─── Seções ──────────────────────────────────────────────────────────────
  sectionNumber: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 10,
  },
  sectionIntro: {
    fontSize: 9.5,
    color: COLORS.muted,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  hr: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },

  // ─── Cards genéricos ────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 1.5,
  },
  cardMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 6,
  },
  cardMetaLabel: {
    fontSize: 7.5,
    color: COLORS.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardMetaValue: {
    fontSize: 8.5,
    color: COLORS.text,
    fontFamily: "Helvetica-Bold",
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
  },

  // ─── Funil ───────────────────────────────────────────────────────────────
  funnelStageRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  funnelStageLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    width: 90,
  },
  funnelBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  funnelBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
  },
  funnelStageNumbers: {
    fontSize: 8,
    color: COLORS.muted,
    width: 130,
    textAlign: "right",
  },
  /** Etapa com o maior gap — mesma ideia do selo "Maior gargalo" da tela (funnel-leak-map.tsx). */
  funnelStageRowHighlight: {
    borderColor: COLORS.orange,
    borderWidth: 1.5,
    backgroundColor: "#FFF6EF",
  },
  biggestLeakBadge: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.orange,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  // ─── Prioridades numeradas ──────────────────────────────────────────────
  priorityNumber: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    marginBottom: 4,
  },

  // ─── Grid de 2/3 colunas ────────────────────────────────────────────────
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  // ─── Plano de 90 dias — 3 fases coloridas (espelha a tela) ──────────────
  phaseCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  phaseHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  phaseGoal: {
    fontSize: 9,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 1.5,
    marginBottom: 8,
  },
  phaseMilestoneBox: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  phaseMilestoneLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  phaseMilestoneValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  phaseActionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    marginBottom: 3,
  },
  phaseActionBody: {
    fontSize: 8.5,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.4,
    marginBottom: 6,
  },
  phaseActionDetail: {
    fontSize: 8,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  contentBriefBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    padding: 7,
    marginBottom: 6,
  },
  contentBriefHeading: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  contentBriefSubtitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.4,
    marginBottom: 2,
  },
  contentBriefItemTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    lineHeight: 1.4,
  },
  contentBriefItemBody: {
    fontSize: 8,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.4,
    marginTop: 1,
  },
  phaseActionMetaLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  phaseActionMetaValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  phaseActionCriteria: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    padding: 7,
    marginTop: 6,
  },
  actionTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },

  // ─── Resumo estratégico (espelha src/components/result/plan-strategic-summary.tsx) ──
  strategicCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  strategicHeadline: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    lineHeight: 1.3,
    marginBottom: 10,
  },
  strategicTileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  strategicTile: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: 9,
    marginBottom: 8,
  },
  strategicTileLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7FA8EB",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  strategicTileBody: {
    fontSize: 8.5,
    color: "#E3EAF6",
    lineHeight: 1.5,
  },
  budgetBarTrack: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  budgetLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  budgetLegendText: {
    fontSize: 7.5,
    color: "#C9D4E8",
  },

  // ─── Cronograma das frentes (espelha src/components/result/plan-cronograma.tsx) ─────
  frontLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  frontLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  frontLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  frontLegendText: {
    fontSize: 7.5,
    color: COLORS.muted,
  },
  frontRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  frontLabel: {
    width: 100,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
  },
  frontCell: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    backgroundColor: COLORS.bgLight,
    alignItems: "center",
    justifyContent: "center",
  },
  frontCellFilled: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },

  // ─── Pílula genérica (concorrência, status, proveniência) ──────────────
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },

  // ─── Causa-raiz (espelha src/components/result/root-cause-chain.tsx) ────
  rootCauseCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  rootCauseLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#F59A5E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  rootCauseText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    lineHeight: 1.35,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 5,
  },
  evidenceNumber: {
    width: 14,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
  },
  evidenceText: {
    flex: 1,
    fontSize: 8.5,
    color: COLORS.text,
    lineHeight: 1.4,
  },

  // ─── Prioridades (espelha priorities-section.tsx) ──────────────────────
  priorityMeta: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    marginTop: 6,
    fontSize: 8,
    color: COLORS.muted,
  },

  // ─── Agenda semanal (espelha weekly-agenda-section.tsx) ────────────────
  agendaList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  agendaRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  agendaRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  agendaDay: {
    width: 56,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  agendaFocus: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
    marginBottom: 2,
  },
  agendaActivities: {
    fontSize: 8.5,
    color: COLORS.muted,
    lineHeight: 1.4,
  },

  // ─── Indicadores (espelha indicators-section.tsx) ──────────────────────
  indicatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  indicatorCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
  },
  indicatorName: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 3,
  },
  indicatorValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },
  indicatorTarget: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
  },

  // ─── Palavras-chave de SEO (espelha seo-opportunities-section.tsx) ─────
  seoTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  seoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  seoHeaderCell: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  seoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  seoColRank: { width: 22, fontSize: 8, color: COLORS.muted },
  seoColKeyword: { flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: COLORS.navy, paddingRight: 6 },
  seoColVolume: { width: 78, fontSize: 8.5, color: COLORS.text },
  seoColCompetition: { width: 70 },
  seoColStatus: { width: 92 },
  seoCtaBox: {
    backgroundColor: "#E3F6EA",
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  seoCtaText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },

  // ─── Mockups dentro das fases (material rico, anúncio, LP) — painel
  // branco sobre a cor da fase, igual aos mockups da tela. ───────────────
  mockPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 9,
    marginBottom: 6,
  },
  mockLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.mutedLight,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },

  // Material rico (espelha plan-content-mockup.tsx + RichMaterialShowcase)
  materialRow: { flexDirection: "row", gap: 10 },
  materialCover: {
    width: 80,
    height: 108,
    backgroundColor: COLORS.navy,
    borderRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
    padding: 7,
    justifyContent: "space-between",
  },
  materialCoverEyebrow: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: "#F59A5E",
    textTransform: "uppercase",
  },
  materialCoverTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.white, lineHeight: 1.25 },
  materialCoverCompany: { fontSize: 5.5, color: "#AEB9E0" },
  materialTextCol: { flex: 1 },
  materialEyebrow: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.orangeDeep,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  materialTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.navy, marginBottom: 3 },
  materialSubtitle: { fontSize: 8, color: COLORS.text, lineHeight: 1.4, marginBottom: 5 },
  materialSectionRow: { flexDirection: "row", gap: 5, marginBottom: 4 },
  materialSectionNumber: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FDE7D8",
    color: "#9A3F0B",
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 2.5,
  },
  materialSectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.navy },
  materialSectionBody: { fontSize: 7.5, color: COLORS.muted, lineHeight: 1.35 },
  materialCoverIdea: { fontSize: 7.5, color: COLORS.muted, lineHeight: 1.4, marginTop: 6 },

  // Anúncio no feed do Meta Ads (espelha PaidTrafficShowcase)
  adCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  adHeader: { flexDirection: "row", alignItems: "center", gap: 6, padding: 7 },
  adAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  adAvatarText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.white },
  adCompany: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.navy },
  adSponsored: { fontSize: 6.5, color: COLORS.mutedLight },
  adPrimaryText: { fontSize: 8, color: COLORS.text, lineHeight: 1.4, paddingHorizontal: 7, paddingBottom: 6 },
  adCreative: { backgroundColor: COLORS.navy, paddingVertical: 18, paddingHorizontal: 14 },
  adAccent: { width: 18, height: 2, backgroundColor: COLORS.orange, marginBottom: 6 },
  adHeadline: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.white, lineHeight: 1.3 },
  adSubheadline: { fontSize: 8, color: "#C9D4E8", lineHeight: 1.4, marginTop: 4 },
  adFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    backgroundColor: "#F3F5F8",
    padding: 7,
  },
  adDomain: { fontSize: 6, color: COLORS.mutedLight, textTransform: "uppercase" },
  adFooterHeadline: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: COLORS.navy },
  adCta: {
    backgroundColor: "#E0E5EE",
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.navy,
  },

  // Hero da landing page (espelha LandingPageShowcase)
  lpInfoRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  lpInfoTile: { flex: 1, backgroundColor: COLORS.bgLight, borderRadius: 4, padding: 6 },
  lpInfoLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: COLORS.mutedLight,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  lpInfoValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.navy, lineHeight: 1.3 },
  lpBrowser: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  lpBrowserBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEF1F5",
    padding: 5,
  },
  lpDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#C3CBD8" },
  lpAddress: {
    marginLeft: 4,
    backgroundColor: COLORS.white,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 6.5,
    color: COLORS.muted,
  },
  lpHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.navy,
    padding: 12,
  },
  lpHeroText: { flex: 1 },
  lpHeroEyebrow: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#F59A5E",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  lpHeroHeadline: { fontSize: 12, fontFamily: "Helvetica-Bold", color: COLORS.white, lineHeight: 1.3 },
  lpHeroSub: { fontSize: 8, color: "#C9D4E8", lineHeight: 1.4, marginTop: 4 },
  lpForm: { width: 150, backgroundColor: COLORS.white, borderRadius: 5, padding: 7 },
  lpFormLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", color: COLORS.mutedLight, marginBottom: 1 },
  lpField: {
    borderWidth: 1,
    borderColor: "#D5DCE7",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 3.5,
    fontSize: 7,
    color: "#8993A4",
    marginTop: 3,
  },
  lpButton: {
    backgroundColor: COLORS.orangeDeep,
    borderRadius: 3,
    paddingVertical: 5,
    marginTop: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textAlign: "center",
  },
});
