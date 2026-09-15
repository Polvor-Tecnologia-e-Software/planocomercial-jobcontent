import { StyleSheet } from "@react-pdf/renderer";

/**
 * Cores da Job Content, conforme pedido. Só as duas oficiais — o resto
 * da paleta é neutro (cinza/branco), para o documento ficar executivo e
 * legível, não "colorido demais".
 */
export const COLORS = {
  navy: "#0C1D49",
  blue: "#153CA3",
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
  coverStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  coverStatBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 14,
  },
  coverStatLabel: {
    fontSize: 8,
    color: "#AEB9E0",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coverStatValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
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
});
