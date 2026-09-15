import type { Metadata } from "next";
import { Inter, Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Fontes da identidade visual Job Content: Plus Jakarta Sans (títulos) e
// Inter (texto), via next/font/google — os arquivos são baixados uma
// única vez em build/primeiro `next dev` e servidos localmente a partir
// daí (self-hosted, sem chamada a fonts.googleapis.com em produção,
// diferente de um <link> apontando pro CDN do Google). Só exige acesso à
// internet no momento do build, não em runtime.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

// Montserrat — usada só na tela inicial (Promise Screen), conforme o
// layout aprovado para essa tela especificamente (ver
// src/components/diagnostic/promise-screen.tsx). O resto do produto
// segue com Plus Jakarta Sans/Inter; carregada aqui (não só na tela
// inicial) porque next/font/google exige declarar a fonte no escopo do
// layout raiz.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plano Comercial Inteligente em 90 Dias™",
  description:
    "Descubra onde sua operação comercial está perdendo oportunidades e receba um plano priorizado para os próximos 90 dias.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plusJakartaSans.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
