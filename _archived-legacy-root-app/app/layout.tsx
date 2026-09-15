import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Planner B2B™ | Plano Inteligente de Crescimento Comercial",
  description: "Diagnóstico comercial B2B com IA. Descubra os gargalos da sua máquina comercial e receba um plano estratégico personalizado para os próximos 90 dias.",
  keywords: ["growth planner", "diagnóstico comercial", "b2b", "plano de vendas"],
  openGraph: {
    title: "Growth Planner B2B™",
    description: "Diagnóstico e plano de crescimento comercial com IA",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c4a6e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
