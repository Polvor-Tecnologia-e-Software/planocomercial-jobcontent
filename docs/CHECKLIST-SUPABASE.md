# Checklist — Configuração do Supabase

## Projeto

- [ ] Crie um projeto Supabase dedicado a este app (não reutilize um
      projeto de outro produto) — região próxima do público-alvo (ex.:
      `sa-east-1` para tráfego majoritariamente brasileiro).
- [ ] Anote a URL do projeto e as duas chaves (`anon` e `service_role`) em
      Project Settings → API. A `service_role` é secreta — trate como uma
      senha de admin do banco inteiro.

## Schema

- [ ] Abra o SQL Editor do projeto e execute o conteúdo completo de
      `supabase/schema.sql` deste repositório, de uma vez. Ele cria:
      todas as tabelas usadas por `src/lib/database/*.ts`, os triggers de
      `updated_at`/`normalized_website`, a função de rate limiting, e
      habilita RLS em tudo.
- [ ] Confirme que todas as tabelas aparecem em Table Editor:
      `companies`, `leads`, `diagnostics`, `diagnostic_answers`,
      `site_analyses`, `seo_analyses`, `funnel_analyses`, `diagnostic_scores`,
      `diagnostic_signals`, `action_library`, `diagnostic_actions`,
      `ai_reports`, `pdf_reports`, `rd_integrations`, `analytics_events`,
      `rate_limits`.
- [ ] Depois de rodar o schema, regenere os tipos TypeScript e confirme
      que batem com `src/types/database.ts` (o arquivo atual foi mantido
      manualmente por não haver projeto Supabase real conectado durante o
      desenvolvimento):
      ```bash
      npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
      ```
      Trate a saída do CLI como fonte de verdade a partir desse momento —
      se algo divergir do que está manualmente escrito hoje, o CLI está
      certo.

## Row Level Security — confira antes de ir ao ar

Este é o ponto de maior risco de vazamento de dados (e-mail/telefone de
leads, diagnósticos comerciais completos) se configurado errado.

- [ ] Em Authentication → Policies, confirme que **nenhuma tabela de
      negócio** (todas exceto, propositalmente, nenhuma) tem uma policy
      permitindo `anon`/`authenticated`. O app funciona inteiramente pela
      `service_role`, que ignora RLS — então "nenhuma policy" é o estado
      correto, não um esquecimento.
- [ ] **Nunca** adicione uma policy do tipo `USING (true)` numa tabela com
      dado de lead/diagnóstico só para "fazer funcionar" algo que parece
      estar sendo bloqueado por RLS — isso reabre a tabela inteira para
      qualquer pessoa de posse da chave anônima (que é pública por design,
      visível no bundle do navegador). Se algo legítimo precisar de acesso
      via chave anônima no futuro, escreva uma policy escopada (ex.: por
      `auth.uid()` ou por um token de posse), nunca `true`.
- [ ] Teste manualmente: com a `anon key` e a REST API do Supabase
      (`https://SEU_PROJETO.supabase.co/rest/v1/leads?select=*`, header
      `apikey: SUA_ANON_KEY`), confirme que a resposta vem vazia/negada,
      não com dados de leads reais.

## Storage — bucket `pdf-reports` (obrigatório a partir da Etapa 5)

O código (`src/server/generate-commercial-plan-pdf.tsx`) assume que este
bucket **já existe** — ele não cria o bucket sozinho. Crie manualmente
antes de testar a geração de PDF:

- [ ] No painel do Supabase: **Storage → New bucket**.
      - **Name**: `pdf-reports` (exatamente esse nome — é o que o código usa).
      - **Public bucket**: **desmarcado** (privado). Este é o ponto mais
        importante desta etapa — um bucket público tornaria todos os
        planos comerciais (dados de diagnóstico de clientes) acessíveis
        por qualquer pessoa com o link, sem precisar de signed URL.
      - **File size limit**: 10 MB (um PDF de um plano de 90 dias fica
        bem abaixo disso; o limite é só uma proteção extra).
      - **Allowed MIME types**: `application/pdf`.
- [ ] Clique em "Save"/"Create bucket".
- [ ] **Não crie nenhuma policy pública de leitura/escrita para este
      bucket.** O código só acessa o Storage pela `service_role`
      (`src/lib/supabase/admin.ts`), que ignora qualquer policy — igual
      ao padrão de RLS das tabelas. Todo acesso de fora do backend
      acontece por uma signed URL de 1 hora, gerada sob demanda a cada
      download — nunca por um link direto ao arquivo.
- [ ] Confirme que o bucket está privado: em Storage → pdf-reports →
      Configuration, o campo "Public" deve estar desligado. Alternativa:
      tente abrir `https://SEU_PROJETO.supabase.co/storage/v1/object/public/pdf-reports/qualquer-coisa`
      no navegador sem estar logado — deve retornar erro/vazio, nunca um
      arquivo.
- [ ] Teste a geração ponta a ponta: complete um diagnóstico até o plano
      pronto, clique em "Baixar plano em PDF" na tela de resultado, e
      confirme que uma nova pasta com o nome do `diagnosticId` aparece
      dentro do bucket, contendo um arquivo `.pdf` com nome em UUID (nunca
      o nome da empresa).

## Operação

- [ ] Configure a limpeza periódica de `rate_limits` (linhas antigas) e
      considere o mesmo para `analytics_events` conforme o volume —
      sugestão de `pg_cron` no comentário final de `supabase/schema.sql`.
- [ ] Configure backups automáticos (Point-in-Time Recovery, disponível
      nos planos pagos do Supabase) antes de ter dados reais de leads.
- [ ] Anote o plano/limites do projeto (linhas, storage, egress,
      chamadas) e configure alerta de uso — leads e diagnósticos
      acumulam rápido em campanhas de tráfego pago.
- [ ] LGPD: defina e documente por quanto tempo dados de `leads` (PII:
      e-mail, telefone) são retidos, e o processo para atender pedidos de
      exclusão. O schema grava `consent_given` + `consent_version`
      versionados, mas retenção/exclusão é uma decisão operacional, não
      automatizada pelo código atual.
