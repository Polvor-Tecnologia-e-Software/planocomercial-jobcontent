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

  // ─── Cartões de destaque (Gargalo/Qualidade/Confiança) — espelha
  // exatamente src/components/result/hero-section.tsx (borda superior
  // colorida + valor colorido), a cor de cada um vem inline por card. ────
  heroStatRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderRadius: 6,
    borderTopWidth: 3,
    padding: 12,
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
});
