import type { Metadata } from "next";
import { Inter, Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";

import { UtmPersistence } from "@/components/analytics/utm-persistence";
import "./globals.css";

/** Google Tag Manager — no layout raiz para valer em todas as páginas. */
const GTM_ID = "GTM-KLL6J82W";

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
      <head>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* useSearchParams exige Suspense; o fallback é nada (o componente não desenha). */}
        <Suspense fallback={null}>
          <UtmPersistence />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
