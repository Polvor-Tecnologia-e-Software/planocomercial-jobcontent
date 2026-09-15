import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança padrão, aplicados a toda resposta.
 *
 * Achado na auditoria final de produção: docs/CHECKLIST-DEPLOY-VERCEL.md
 * já pedia para "confirmar que os headers de segurança em next.config.ts
 * chegam nas respostas de produção" — mas este arquivo nunca tinha sido
 * criado, então nenhum desses cabeçalhos era enviado. Corrigido aqui.
 *
 * Deliberadamente NÃO inclui Content-Security-Policy — precisa de ajuste
 * fino contra os recursos reais da página (Tailwind/Framer Motion usam
 * estilos inline) antes de ser seguro habilitar sem quebrar a UI; ver
 * docs/CHECKLIST-DEPLOY-VERCEL.md.
 */
const securityHeaders = [
  // Impede que a página seja carregada dentro de um <iframe> em outro
  // site (proteção contra clickjacking) — relevante aqui porque a tela
  // inicial e a captura coletam dados de contato.
  { key: "X-Frame-Options", value: "DENY" },
  // Impede que o navegador tente "adivinhar" um tipo de conteúdo
  // diferente do declarado (mitigação de alguns vetores de XSS via
  // upload/servir arquivo com Content-Type incorreto).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Envia a origem completa só para requisições same-origin; para
  // navegação cross-origin, envia apenas a origem (sem path/query) —
  // evita vazar, por exemplo, um diagnosticId de um Referer para um
  // domínio externo linkado a partir da página de resultado.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desliga APIs de navegador não usadas por este produto.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Instrui o navegador a sempre usar HTTPS neste domínio depois do
  // primeiro acesso — a Vercel já força HTTPS, isto é defesa em
  // profundidade para quem acessar por um link http:// antigo.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
