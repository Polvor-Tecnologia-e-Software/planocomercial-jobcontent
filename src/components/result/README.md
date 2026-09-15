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
  `inbound-marketing-section.tsx` (só quando o gargalo/risco é demanda),
  `weekly-agenda-section.tsx`, `indicators-section.tsx`,
  `limitations-section.tsx`, `cta-section.tsx` — uma seção por arquivo,
  seguindo a numeração do pedido original.
- `dimension-labels.ts` — rótulos em português das 6 dimensões, única
  fonte usada em toda a tela.

PDF ainda não implementado — botão "Baixar plano em PDF" existe,
desabilitado, sem download falso.
