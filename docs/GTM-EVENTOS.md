# Eventos da jornada no GTM (dataLayer)

Cada etapa da jornada envia um evento ao `dataLayer` do Google Tag Manager
(contêiner `GTM-KLL6J82W`). Os nomes seguem o padrão `etapa_NN_nome`: o
número indica a ordem da etapa, o nome indica qual é.

Código: `src/lib/analytics/data-layer.ts` (lista única de eventos).

## Eventos

| Evento | Quando dispara | Parâmetros extras |
|---|---|---|
| `etapa_01_landing` | Tela inicial (landing) aparece | — |
| `etapa_02_formulario` | Formulário inicial aparece (clique em começar) | — |
| `etapa_03_dados_empresa` | Tela de confirmação dos dados da empresa aparece (depois da análise do site) — **indica que o formulário foi enviado** | `diagnostico_id`, `analise_site` (`concluida`, `sem_site`, `site_invalido`, `falhou`) |
| `etapa_04_desafio` | Tela de escolha do desafio aparece | `diagnostico_id` |
| `etapa_05_perguntas` | Entrada nas perguntas | `diagnostico_id`, `desafio` (D1 a D6) |
| `etapa_05_pergunta` | Cada pergunta exibida | `diagnostico_id`, `desafio`, `pergunta_id`, `pergunta_numero`, `perguntas_total` |
| `etapa_06_telefone` | Etapa do telefone aparece | `diagnostico_id`, `desafio` |
| `etapa_07_gerando_plano` | Telefone enviado e geração do plano começou | `diagnostico_id`, `origem` (`telefone` ou `nova_tentativa`) |
| `etapa_07_erro_geracao` | Tela de falha na geração do plano | `diagnostico_id` |
| `etapa_08_resultado` | Tela final com o plano aparece | `diagnostico_id`, `desafio`, `gargalo_principal` |

Todos os eventos também levam `etapa_numero` (1 a 8) e `etapa_nome`.
Nenhum evento envia dado pessoal (nome, e-mail, telefone, empresa).

Os eventos de tela disparam toda vez que a tela aparece — recarregar a
página ou voltar a ela dispara de novo, como uma visualização de página.

## Eventos de clique

| Evento | Quando dispara | Parâmetros |
|---|---|---|
| `clique_whatsapp` | Clique em qualquer botão de WhatsApp | `local`, `diagnostico_id` |
| `clique_download_pdf` | Clique em "Baixar PDF" | `local` (`cta_final`), `diagnostico_id` |
| `download_pdf_concluido` | PDF pronto e aberto em nova aba | `diagnostico_id` |

Valores de `local` do WhatsApp (onde fica o botão na tela de resultado):

| `local` | Botão |
|---|---|
| `topo` | "Falar com um especialista" no topo azul |
| `causa_raiz` | "Conversar pelo WhatsApp" abaixo da causa-raiz |
| `prioridade_1`, `prioridade_2`, `prioridade_3` | Botão de cada prioridade |
| `resumo_estrategico` | "Validar com um especialista" no resumo estratégico |
| `sugestoes_bloqueadas` | "Desbloquear pelo WhatsApp" |
| `executar_plano` | "Quero ajuda para executar" |
| `palavras_chave` | "Falar com especialista em SEO" |
| `cta_final` | "Falar com um especialista" no fim da página |

A diferença entre `clique_download_pdf` e `download_pdf_concluido` mostra
quantos pedidos de PDF falharam ou foram abandonados no meio.

Botões novos de WhatsApp: basta acrescentar `data-gtm-click="whatsapp"` e
`data-gtm-local="nome_do_local"` no link — o ouvinte global
(`src/components/analytics/click-tracking.tsx`) cuida do resto.

## Como configurar no GTM

1. **Variáveis** (Variáveis → Nova → Variável da camada de dados): crie uma
   para cada parâmetro que for usar — `etapa_numero`, `etapa_nome`,
   `diagnostico_id`, `desafio`, `pergunta_numero`, `analise_site` etc.
2. **Acionadores** (Acionadores → Novo → Evento personalizado):
   - um por etapa, com o nome exato do evento (ex.: `etapa_06_telefone`); ou
   - um único para todas as etapas, marcando "Usar correspondência de
     expressão regular" com `^etapa_.*`.
3. **Tags**: ligue as tags (GA4, Google Ads, Meta etc.) aos acionadores.
   Para o GA4, uma tag "Evento do GA4" com nome do evento `{{Event}}`
   envia cada etapa com o próprio nome.
4. Teste no modo **Visualizar** do GTM, percorrendo a jornada até o fim.

### Sugestão de conversões

- **Lead (formulário enviado):** `etapa_03_dados_empresa`
- **Lead com telefone:** `etapa_07_gerando_plano` com `origem = telefone`
- **Diagnóstico concluído:** `etapa_08_resultado`
- **Interesse comercial:** `clique_whatsapp` (qualquer `local`)
