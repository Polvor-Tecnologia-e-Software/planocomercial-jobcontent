# components/result

Tela de resultado do plano comercial de 90 dias — quase tudo Server
Component (os dados já vêm prontos de `src/server/get-commercial-plan-result.ts`,
que combina o funil determinístico da Etapa 2 com o `ai_reports` da Etapa
3; nada aqui chama IA).

- `result-page.tsx` — orquestrador: decide, a partir do `status`, qual
  estado desenhar.
- `plan-status-states.tsx` — estados sem plano pronto: `not_generated`,
  `generating`, `failed` (com nova tentativa).
- `generate-plan-trigger.tsx` — único client component da tela: botão que
  dispara/tenta de novo a geração.
- `hero-section.tsx`, `funnel-leak-map.tsx`, `root-cause-chain.tsx`,
  `priorities-section.tsx`, `plan-90-days-section.tsx`,
  `weekly-agenda-section.tsx`, `indicators-section.tsx`,
  `seo-opportunities-section.tsx`, `limitations-section.tsx`,
  `cta-section.tsx` — uma seção por arquivo, seguindo a numeração do
  pedido original. (`inbound-marketing-section.tsx` existiu e foi
  removida — pedido do usuário.)
- `dimension-labels.ts` — rótulos em português das 6 dimensões, única
  fonte usada em toda a tela.

PDF implementado (`src/lib/pdf/commercial-plan-document.tsx` +
`src/server/generate-commercial-plan-pdf.tsx`) — espelha o mesmo
conteúdo desta tela.
