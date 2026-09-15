# Checklist — Integração RD Station

## Status atual: implementada (Conversão via API Key)

A integração usa exclusivamente o endpoint oficial de Conversão do RD
Station Marketing (`POST https://api.rd.services/platform/conversions`),
autenticado por API Key na query string — **nunca OAuth** nesta
integração (as variáveis `RD_STATION_CLIENT_ID/SECRET/REFRESH_TOKEN`
seguem reservadas em `.env.example` para uma eventual integração futura
que realmente precise de token renovável, mas não são lidas por este
código).

Código em `src/lib/rd-station/` (endpoint, mapeamento de campos, payload,
chamada HTTP) e `src/server/send-rd-station-conversion.ts` (orquestração:
consentimento, idempotência, retry). Disparada a partir de
`src/server/actions/generate-commercial-plan-action.ts`, assim que o
plano comercial de 90 dias termina de ser gerado (ou reaproveitado do
cache) — nunca a cada etapa do questionário, e nunca bloqueia a pessoa de
ver o resultado se o RD Station estiver indisponível.

## Consentimento LGPD — implícito, resolvido

A função só envia a conversão depois de `leads.consent_given = true`.
Isso é marcado automaticamente por `startDiagnostic()`
(`src/server/start-diagnostic.ts`, `leads.recordConsent`) assim que a
pessoa envia a Tela 2 — não há checkbox separado: o texto informativo
perto do botão "Continuar" (`CaptureForm`) já é o aviso de consentimento,
e o próprio envio do formulário é o ato de consentir. A versão do texto
fica em `LGPD_CONSENT_VERSION` (`start-diagnostic.ts`) e é gravada em
`leads.consent_version` — suba esse valor sempre que o SENTIDO do texto
mudar (nunca só por ajuste cosmético de redação).

## Antes de configurar

- [ ] Obtenha a API Key do RD Station Marketing (não é a mesma coisa que
      credenciais OAuth) — painel do RD Station, ver passo a passo abaixo.
- [ ] Crie no RD Station os campos personalizados que o payload envia
      (lista completa e como criar, abaixo) — sem eles, o RD Station
      ainda aceita a conversão, mas os dados desses campos são
      descartados silenciosamente pelo RD Station (comportamento do RD,
      não deste código).

## Ao configurar

- [ ] **Onde encontrar a API Key**: painel do RD Station → **Configurações
      da conta** (ícone de engrenagem) → **Integrações** → **API Key
      RD Station Marketing**. Copie o valor mostrado ali (é diferente do
      Client ID/Secret usados em integrações OAuth).
- [ ] **Onde colocar**: copie `.env.example` para `.env.local` (se ainda
      não fez) e preencha:
      ```
      RD_STATION_API_KEY=a-chave-copiada-do-painel
      ```
      Nunca prefixe com `NEXT_PUBLIC_` — a chamada acontece só no
      servidor (`src/lib/rd-station/client.ts`, `import "server-only"`),
      nunca no navegador.
- [ ] **`conversion_identifier`**: já está definido em
      `src/lib/rd-station/config.ts` como `"plano-comercial-90-dias"`. Se
      o time de marketing já usa outro padrão de nomenclatura de
      conversões no RD Station, troque o valor **nesse único arquivo**
      (não precisa mexer em mais nada) antes do primeiro envio em
      produção — trocar depois de já ter enviado eventos cria, do ponto
      de vista do RD Station, uma conversão nova (o histórico da antiga
      não migra sozinho).
- [ ] **Campos personalizados a criar no RD Station** (painel → CRM/Automação
      → Campos personalizados, ou Configurações → Campos de contato,
      dependendo da versão do painel — o nome exato do menu varia): crie
      um campo de texto para cada um destes, usando exatamente este
      identificador (sem espaços, minúsculo, é o que o código envia):

      | Identificador (`cf_*`)      | Conteúdo                                          |
      |------------------------------|----------------------------------------------------|
      | `cf_utm_content`             | UTM content (não existe campo nativo no RD)        |
      | `cf_diagnostico_id`          | ID interno do diagnóstico (rastreio/suporte)       |
      | `cf_desafio_principal`       | Desafio escolhido na jornada (texto)               |
      | `cf_gargalo_principal`       | Gargalo comercial identificado (texto, em português) |
      | `cf_nivel_confianca`         | `low` / `medium` / `high`                          |
      | `cf_segmento_empresa`        | Segmento da empresa, se confirmado na jornada      |
      | `cf_link_plano_comercial`    | Link assinado do PDF (só quando já existir um)     |

      Removidos por decisão do time (não são mais enviados nem precisam
      existir no RD Station): `cf_risco_secundario`, `cf_qualidade_dados`,
      `cf_status_diagnostico`.

      O nome da pessoa agora é capturado na Tela 2 (campo "Seu nome") e
      enviado no campo nativo `name` — não é um `cf_*`, não precisa ser
      criado manualmente.

- [ ] **Como descobrir se o identificador ficou certo**: depois de criar
      um campo personalizado no painel, o RD Station mostra o
      identificador técnico dele (geralmente ao passar o mouse sobre o
      campo na lista, ou na URL de edição do campo). Confirme que bate
      exatamente com a coluna "Identificador" acima — **maiúscula/minúscula
      e underscore importam**; um identificador diferente faz o RD Station
      simplesmente ignorar aquele valor, sem erro nenhum.

## Ao testar

- [ ] **Conversão de teste**: complete um diagnóstico de teste até gerar
      o plano de 90 dias (Tela de resultado → "Gerar meu plano
      comercial"). `leads.consent_given` já fica `true` automaticamente
      desde o envio da Tela 2 (consentimento implícito, ver seção acima)
      — não precisa editar nada manualmente no Supabase.
- [ ] Use uma conta/ambiente de teste do RD Station antes de apontar
      `RD_STATION_API_KEY` para a conta de produção do time de marketing.
- [ ] **Onde confirmar que o lead chegou**: painel do RD Station →
      **Contatos**, busque pelo e-mail usado no teste. O contato deve
      aparecer com os campos nativos (nome, e-mail, empresa) e os
      campos personalizados da tabela acima preenchidos.
- [ ] **Onde confirmar as UTMs**: no RD Station, os equivalentes de UTM
      aparecem como **Origem**, **Mídia** e **Campanha** na timeline do
      contato (nomes nativos `traffic_source/medium/campaign` — não
      `utm_source/medium/campaign`, apesar de carregarem o mesmo valor).
      `utm_content` aparece como o campo personalizado `cf_utm_content`.
      Para testar, acesse a Tela 1 do diagnóstico com uma URL como
      `?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_content=criativo1&utm_term=plano-90-dias`
      antes de iniciar o diagnóstico de teste.
- [ ] Teste explicitamente o caminho de falha: tire `RD_STATION_API_KEY`
      do `.env.local` (ou coloque um valor inválido) e confirme que o
      plano ainda é gerado e exibido normalmente — a integração deve
      falhar em silêncio (registrada em `rd_integrations`, nunca
      quebrando a tela de resultado).
- [ ] Confirme na tabela `rd_integrations` (Supabase → Table Editor) que
      existe **uma única linha** por diagnóstico de teste mesmo depois de
      clicar em "Tentar novamente" várias vezes — `status` deve terminar
      em `sent` (sucesso), `failed` (erro de validação/autenticação, não
      tenta de novo sozinho) ou `retrying` (erro temporário, uma próxima
      geração/tentativa do plano aciona um novo envio).

## Segurança e LGPD (já implementado no código, não exige configuração)

- API Key só é lida em código server-only (`src/lib/rd-station/client.ts`),
  nunca em variável `NEXT_PUBLIC_*`, nunca enviada ao navegador.
- Nenhum log imprime a API Key, o payload completo (e-mail/telefone) ou o
  corpo da resposta do RD Station — só metadados (status, tentativas,
  latência, timestamps) em `send-rd-station-conversion.ts`.
- Envio condicionado a `leads.consent_given = true` (consentimento
  implícito no envio da Tela 2, ver seção acima).
- `rd_integrations` tem uma constraint única em
  (`diagnostic_id`, `event_name`) — duas chamadas concorrentes (clique
  duplo, duas abas, retry) nunca duplicam o evento; a segunda reaproveita
  a linha já criada pela primeira.
- Erros de validação (400) e autenticação (401/403) são tratados como
  permanentes — não ficam retentando indefinidamente contra uma API Key
  errada ou um payload que o RD Station rejeita. Erros de rede/timeout/5xx/429
  são tratados como temporários, elegíveis a nova tentativa (até 3
  tentativas por diagnóstico).
