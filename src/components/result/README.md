# components/result

Tela de resultado do plano comercial de 90 dias — quase tudo Server
Component (os dados já vêm prontos de `src/server/get-commercial-plan-result.ts`,
que combina o funil determinístico da Etapa 2 com o `ai_reports` da Etapa
3; nada aqui chama IA).

- `result-page.tsx` — orquestrador: decide, a partir do `status`, qual
  estado desenhar.
- `plan-status-states.tsx` — estados sem plano pronto: `not_generated`,
  `generating`, `failed` (com nova tentativa).
- `phone-gate.tsx` — client component: pede o telefone (obrigatório, com
  máscara) antes de liberar a tela do diagnóstico, com um CTA grande. A
  página (`src/app/diagnostico/[diagnosticId]/page.tsx`) mostra esta
  etapa no lugar de `ResultPage` sempre que o lead ainda não tem
  telefone. Um clique grava o telefone (`save-lead-phone-action.ts`, com
  consentimento `phone-gate-implicit-v1`) e, se o plano ainda não
  existe, já dispara a geração — substitui o botão "Gerar meu plano
  comercial" nesse caminho.
- `generate-plan-trigger.tsx` — client component: botão que dispara/tenta
  de novo a geração. `plan-month-detail.tsx` é o outro client component da
  tela (abas de mês do plano de 90 dias, ver abaixo) — todo o resto
  permanece Server Component.
- `hero-section.tsx`, `funnel-leak-map.tsx`, `root-cause-chain.tsx`,
  `priorities-section.tsx`, `plan-90-days-section.tsx`,
  `weekly-agenda-section.tsx`, `indicators-section.tsx`,
  `seo-opportunities-section.tsx`, `limitations-section.tsx`,
  `cta-section.tsx` — uma seção por arquivo, seguindo a numeração do
  pedido original. (`inbound-marketing-section.tsx` existiu e foi
  removida — pedido do usuário.)
- `hero-section.tsx` — redesenhada a partir do layout de referência
  anexado (pedido explícito: "o topo do diagnóstico precisa ficar igual
  esse"): faixa azul-marinho de ponta a ponta (quebra o
  `Container size="wide"` da página com `mx-[calc(50%-50vw)]`, só
  localmente aqui — nunca na página inteira) com selo, diagnóstico
  executivo e os dois CTAs (WhatsApp + âncora `#plano` pro
  `plan-90-days-section.tsx`), seguida por 4 cartões brancos com metade
  sobre o fundo azul (margin-top negativo). O logo da Job já é o
  `SiteHeader` (`Logo variant="light"`) — nenhuma logo nova é desenhada
  aqui. O 4º cartão ("Leads por mês") usa `current`/`required` do
  estágio "leads" do funil (já calculados em
  `src/server/get-commercial-plan-result.ts`), nenhum número novo.
- `priorities-section.tsx`, `weekly-agenda-section.tsx` e
  `indicators-section.tsx` — redesenhadas a partir do layout de
  referência anexado (pedido explícito). Prioridades: selo "03 ·
  Prioridades" + título, cartões com número (azul, azul, laranja),
  título, racional e uma linha de indicador/prazo — "Problema
  resolvido"/"Impacto esperado" saíram da tela (o schema continua
  gerando, só não exibe mais aqui). Agenda e indicadores agora ficam lado
  a lado numa grade de 2 colunas em `result-page.tsx` (cada componente
  devolve um `div`, a `section` que os agrupa fica no orquestrador):
  agenda vira uma lista única empilhada com divisórias; indicadores
  viram cartões 2x2 com "valor atual → meta" na mesma linha, sem o
  rótulo de frequência isolado (o campo continua no schema/PDF).
- `seo-opportunities-section.tsx` — redesenhada a partir do layout de
  referência (pedido explícito): selo "04 · Oportunidades", título
  "Palavras-chave para a sua empresa", tabela (#, palavra-chave,
  buscas/mês estimadas, concorrência, status "Nicho não explorado") e
  um CTA de WhatsApp para especialista em SEO. Volume e concorrência
  continuam sendo estimativas da IA, sempre sinalizadas como tal.
- `plan-90-days-section.tsx` compõe o plano de 90 dias a partir do layout
  de referência anexado pelo usuário (mesma estrutura pra qualquer
  objetivo selecionado): `plan-strategic-summary.tsx` (o resumo
  estratégico — a distribuição de verba de mídia é sempre calculada em
  `src/lib/plan-media-budget.ts`, nunca uma porcentagem vinda da IA),
  `plan-cronograma.tsx` (cronograma visual em 12 colunas de semana —
  S1-S12 — derivado deterministicamente de `src/lib/plan-timeline.ts`; a
  granularidade real dos dados continua sendo por MÊS, as 12 colunas são
  só uma grade mais densa pra parecer com o layout de referência, nunca um
  dado novo pedido à IA) e `plan-month-detail.tsx` (abas de mês — pedido
  explícito do usuário: "a ideia das abas de blog, material rico mês a
  mês"). Dentro de cada mês, `plan-month-detail.tsx` mostra: o banner
  colorido do mês (goal + milestone de `phaseSummaries`, um resumo por
  fase pedido pela IA — ver `PlanPhaseSummarySchema`), a
  `plan-fronts-matrix.tsx` (matriz "frente x mês" sempre com os 3 meses
  lado a lado, cabeçalho clicável sincronizado com as mesmas abas — os
  itens de cada célula vêm de `details`/`completionCriteria` que a IA já
  gera por ação, reorganizados, nunca um dado novo), as ações comerciais
  (cartão escuro, reaproveitando o mesmo `ActionCard`/brief de cadência) e
  as de conteúdo e mídia — blog, material rico, landing page e anúncio de
  tráfego pago — num cartão claro no estilo revista. O anúncio aparece
  SEMPRE, pra qualquer objetivo (deixou de depender do gargalo ser demanda
  — pedido explícito: "inclua sempre sugestão de anúncio de tráfego pago,
  seja qual for o objetivo") e nunca troca lugar com nem reduz as ações
  comerciais — as duas coisas são aditivas. Cada tipo de conteúdo tem seu
  próprio layout de referência: `plan-content-mockup.tsx` é a moldura
  visual PADRÃO só da capa de material rico (sempre a mesma forma,
  título real gerado pela IA — nunca um logotipo inventado). A capa
  (pedido explícito, layout de referência) tem um `ContentSectionHeader`
  (cabeçalho com letra fixa — blog A, material rico B, landing page C;
  ver comentário em `plan-month-detail.tsx`) + "Material rico do mês"
  acima do grid, e mostra o nome REAL da empresa diagnosticada no rodapé
  (o mesmo `companyName` do resto da tela, nunca um nome inventado) —
  "Ideia visual para o mockup" fica logo abaixo da capa, não mais na
  coluna de texto. Logo abaixo do material rico (pedido explícito,
  layout de referência) vem a simulação do anúncio como ele apareceria
  no feed do Meta Ads — avatar com a inicial do nome real da empresa +
  nome real + "Patrocinado", criativo escuro com headline/subheadline, e
  rodapé com o domínio real (`companyWebsite`, já normalizado — some a
  linha quando a empresa não informou site) + botão; este bloco não usa
  `ContentSectionHeader` (o layout de referência dele não tinha letra).
  Por fim vem a landing page (pedido explícito: "incluir a simulação do
  hero de cada landing page") — `ContentSectionHeader` com letra "C",
  3 blocos de resumo (nome, URL sugerida, objetivo) e, diferente do
  mockup padrão de material rico, um mockup de navegador com o FORMULÁRIO
  REAL desenhado dentro do hero (campos de `formFields` + `buttonText`,
  gerados pela IA) — a barra de endereço mostra o domínio real
  (`companyWebsite`) + a URL sugerida. A ordem de exibição é blog,
  material rico, anúncio, landing page (antes o anúncio vinha por
  último). Por fim, `plan-locked-teaser.tsx` fecha cada mês — pedido
  explícito, layout de referência: teaser de 6 sugestões bloqueadas
  (100% estático, texto genérico fixo, não gera nem usa nenhum conteúdo
  de IA — "Mais 6 sugestões para o {mês}" usa o tamanho real da lista,
  nunca um número solto) seguido de um segundo CTA ("São N ações só
  neste mês...") que usa o total REAL de ações do mês
  (`plan90Days[mês].length`, passado como `actionsCount`), nunca um
  número inventado.
- `dimension-labels.ts` — rótulos em português das 6 dimensões, única
  fonte usada em toda a tela.

PDF implementado (`src/lib/pdf/commercial-plan-document.tsx` +
`src/server/generate-commercial-plan-pdf.tsx`) — espelha o mesmo
conteúdo desta tela.
