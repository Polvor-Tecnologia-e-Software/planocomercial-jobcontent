// ─── Design tokens for the results dashboard ──────────────────────────────────
// Single source of truth. Import in every results component.

export const T = {
  // Backgrounds
  bg:         "hsl(222 47% 5.5%)",
  bgCard:     "rgba(255,255,255,0.028)",
  bgCardHov:  "rgba(255,255,255,0.05)",
  bgInput:    "rgba(255,255,255,0.04)",

  // Borders
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  borderHov:  "rgba(255,255,255,0.18)",

  // Text
  text:       "hsl(210 40% 96%)",
  muted:      "hsl(215 20% 48%)",
  mutedLg:    "hsl(215 20% 62%)",

  // Brand
  brand:      "#0ea5e9",
  brandLight: "#38bdf8",
  brandDark:  "#0284c7",

  // Semantic
  emerald:    "#10b981",
  emeraldLt:  "#34d399",
  amber:      "#f59e0b",
  amberLt:    "#fbbf24",
  red:        "#ef4444",
  redLt:      "#f87171",
  violet:     "#8b5cf6",
  violetLt:   "#a78bfa",
  pink:       "#ec4899",
  pinkLt:     "#f472b6",

  // Pillar colours
  pillar: {
    demanda:   "#0ea5e9",
    conversao: "#10b981",
    escala:    "#f59e0b",
  },

  // Severity colours
  severity: {
    critical: "#ef4444",
    moderate: "#f59e0b",
    mild:     "#10b981",
  },

  // Score level colours
  level: {
    critico:       "#ef4444",
    basico:        "#f59e0b",
    intermediario: "#3b82f6",
    avancado:      "#10b981",
    elite:         "#0ea5e9",
  },

  // Typography
  fontDisplay: "'Syne', sans-serif",
  fontMono:    "'DM Mono', 'Fira Code', monospace",
  fontBody:    "'DM Sans', sans-serif",

  // Radii
  r:  "10px",
  rL: "14px",
  rXL:"20px",

  // Spacing scale
  s2: "8px",
  s3: "12px",
  s4: "16px",
  s5: "20px",
  s6: "24px",
  s8: "32px",
} as const;

// ─── Helper: pillar colour ─────────────────────────────────────────────────────
export function pillarColor(pillar: string): string {
  return T.pillar[pillar as keyof typeof T.pillar] ?? T.brand;
}

// ─── Helper: glow shadow ──────────────────────────────────────────────────────
export function glow(color: string, intensity: number = 0.15): string {
  return `0 0 24px ${color}${Math.round(intensity * 255).toString(16).padStart(2, "0")}, 0 0 60px ${color}${Math.round(intensity * 0.4 * 255).toString(16).padStart(2, "0")}`;
}

// ─── Helper: glass card style ─────────────────────────────────────────────────
export const glassCard: React.CSSProperties = {
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  backdropFilter: "blur(8px)",
};
