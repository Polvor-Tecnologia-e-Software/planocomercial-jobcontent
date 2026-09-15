# components/diagnostic

Componentes de interface das telas da jornada do diagnóstico.

Implementado até agora:

- `promise-screen.tsx` — Tela 1 (entrada da ferramenta), layout aprovado
  em 3 dobras: hero com ilustração de iceberg (`promise/hero-section.tsx`),
  problema + 3 pilares (`promise/problem-pillars-section.tsx`) e
  entregáveis + fechamento (`promise/closing-section.tsx`). Fonte
  Montserrat, escopada só a esta tela (ver comentário no topo de
  `globals.css`, seção "Tela inicial").
- `capture-form.tsx` — primeira captura (empresa, site, e-mail corporativo).
- `site-analysis-confirmation.tsx` / `site-analysis-fallback.tsx` — confirmação/edição/rejeição da análise automática do site.
- `challenge-selection.tsx` — escolha do desafio principal.
- `adaptive-diagnostic-journey.tsx` — jornada adaptativa de perguntas.
- `diagnostic-journey.tsx` — orquestra a transição entre Tela 1 e a captura inicial, e a barra de progresso.
