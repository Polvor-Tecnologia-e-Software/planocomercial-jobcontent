# Documentação técnica

Referência de arquitetura para quem for continuar este projeto. Para o
estado da jornada do usuário e setup rápido, veja o `README.md` na raiz.

## 1. Visão geral da arquitetura

```
Navegador
   │  (Server Actions / Server Components — sem API REST própria)
   ▼
Next.js App Router (src/app)
   │
   ├─ Server Actions (src/server/actions)  — "use server", finas: extraem
   │    FormData, validam com Zod, delegam para um caso de uso
   │
   ├─ Casos de uso (src/server/*.ts)        — lógica de negócio, sem
   │    conhecer FormData/redirect — testáveis isoladamente
   │
   ├─ Camada de dados (src/lib/database/*)  — um módulo por tabela, todos
   │    usando o cliente Supabase "admin" (service_role)
   │
   ├─ IA (src/lib/ai/*)                     — cliente OpenAI + prompts
   │    + validação de schema
   │
   └─ Segurança (src/lib/security/*)        — SSRF guard, rate limiting
   ▼
Supabase (Postgres + Storage)
```

Não há rotas de API REST (`app/api/*`) nesta implementação — tudo é
Server Actions e Server Components, seguindo o padrão do App Router do
Next.js. Isso é deliberado: menos superfície pública, validação de entrada
centralizada no mesmo lugar que a lógica de negócio.

## 2. Modelo de acesso a dados e RLS

Ponto central para entender a segurança deste projeto:

- **Todo** acesso ao Postgres, em **todo** o código, passa pelo cliente
  `service_role` (`src/lib/supabase/admin.ts`), sempre a partir de
  módulos `server-only`.
- O cliente de navegador (`src/lib/supabase/client.ts`, chave anônima) e o
  cliente de servidor com sessão (`src/lib/supabase/server.ts`) existem no
  código mas **não são usados por nenhuma tabela hoje** — são a base para
  uma futura camada de autenticação de usuário, se vier a existir.
- Por isso, `supabase/schema.sql` habilita RLS em toda tabela mas **não
  cria nenhuma policy** para as roles `anon`/`authenticated`. O
  comportamento padrão do Postgres sem policy é negar tudo — logo, a
  chave anônima (pública, embutida no bundle do navegador) não consegue
  ler nem escrever nada. `service_role` ignora RLS por definição, então a
  aplicação continua funcionando normalmente.
- **Se algum dia um componente client-side precisar consultar o Supabase
  diretamente** (via `createSupabaseBrowserClient`), será necessário
  desenhar policies específicas e escopadas (ex.: por `auth.uid()`) para
  aquela tabela — nunca reabrir com `USING (true)`.

## 3. Segurança da análise de site (superfície mais sensível do projeto)

A análise automática de site é a parte do sistema que aceita a entrada
mais perigosa: uma URL fornecida por qualquer visitante, que o servidor
então busca e envia para um modelo de IA.

Camadas de defesa, em ordem:

1. **Forma da URL** (`src/lib/security/url-guard.ts`, `checkUrlShape`):
   só `http`/`https`, sem credenciais embutidas (`user:pass@host`), só
   portas 80/443, hostnames de metadado/loopback bloqueados por nome.
2. **Resolução de IP** (`checkIpAddress`): todo IP retornado pelo DNS é
   verificado contra faixas privadas/loopback/link-local (inclui
   `169.254.169.254`, o endpoint de metadados de nuvem)/CGNAT/reservadas.
   Se qualquer IP entre os resolvidos for bloqueado, o domínio inteiro é
   rejeitado — mitiga DNS que responde com múltiplos IPs para escapar do
   bloqueio.
3. **DNS pinning** (`safe-fetch.ts`, `requestPinned`): a conexão HTTP real
   é feita diretamente no IP já validado, não em uma nova resolução DNS —
   fecha a janela de ataque de DNS rebinding (mudar a resposta do DNS
   entre a validação e a conexão).
4. **Redirecionamentos revalidados**: cada redirect é resolvido e passa
   pelas mesmas checagens 1–3 antes de ser seguido, com limite de 3 saltos.
5. **Limites de recurso**: timeout de conexão (5s) e de resposta (10s),
   corpo limitado a 3MB, crawl inteiro limitado a 20s e a
   `homepage + até 4 páginas` descobertas por palavra-chave, sempre no
   mesmo domínio.
6. **Prompt injection**: o conteúdo extraído do site é tratado como dado
   não confiável — delimitado por `<site>...</site>` no prompt, com
   instrução explícita para o modelo ignorar qualquer comando embutido
   nele, mesmo que pareça vir de um "sistema" ou "desenvolvedor"
   (`src/lib/ai/site-analysis-prompt.ts`).
7. **Saída forçada por schema + revalidação**: a IA responde via *tool
   use* com um JSON Schema derivado do Zod (nunca texto livre para
   parsear), e o resultado é sempre revalidado com `.strict()` no servidor
   antes de ser aceito ou persistido — um campo extra inventado pela IA é
   rejeitado, não silenciosamente ignorado.
8. **Nunca persiste o HTML/texto bruto** — só o JSON estruturado validado
   e metadados de página (URL, título).

## 4. Rate limiting

`src/lib/security/rate-limit.ts` implementa um limitador de janela fixa
apoiado na tabela `rate_limits` do Supabase (não em memória do processo —
a app roda em funções serverless na Vercel, então memória de processo não
protegeria nada contra abuso distribuído entre instâncias/regiões). O
incremento é atômico via a função SQL `increment_rate_limit`
(`INSERT ... ON CONFLICT DO UPDATE` em uma instrução), evitando que
requisições concorrentes do mesmo IP burlem o limite por corrida.

Aplicado hoje em `startDiagnosticAction` (5 novos diagnósticos por IP a
cada 10 minutos) — o ponto de entrada do funil, que é o gatilho indireto
do crawl + chamada de IA da próxima tela. Reutilize `checkRateLimit()` em
outras Server Actions se abuso for observado nelas.

Uma falha do próprio limitador (ex.: Supabase fora do ar) nunca bloqueia o
usuário — a chamada é liberada e o erro é logado.

**Não implementado** (recomendado antes de tráfego significativo — ver
`docs/CHECKLIST-DEPLOY-VERCEL.md`): CAPTCHA/bot-check (ex.: Cloudflare
Turnstile) no formulário de entrada. Rate limiting por IP contém abuso
automatizado simples, mas não distingue um humano de um bot distribuído
em muitos IPs.

## 5. Variáveis de ambiente

Duas fontes, cada uma validada por um schema Zod que falha alto (mensagem
clara) em vez de deixar `undefined` vazar para o meio de uma chamada:

- `src/config/env.client.ts` — só variáveis `NEXT_PUBLIC_*`. Import
  seguro em qualquer lugar, inclusive Client Components.
- `src/config/env.server.ts` — segredos. Importa `"server-only"`: se um
  Client Component importar este arquivo por engano, **o build falha**
  em vez de vazar o segredo no bundle do navegador.

`RD_STATION_API_KEY` é opcional no schema atual de propósito: sua ausência
desativa silenciosamente só a integração de Conversão com o RD Station
(`src/lib/rd-station/`), nunca o resto da aplicação — ver
`docs/CHECKLIST-RD-STATION.md`. `RD_STATION_CLIENT_ID`/`_SECRET`/`_REFRESH_TOKEN`
seguem reservados e opcionais para uma eventual integração OAuth futura —
não são lidos pela integração de Conversão via API Key.

A seção "Oportunidades de SEO" do plano (`src/lib/seo/`) usa a mesma
`AI_API_KEY` já obrigatória para o restante do produto — não depende de
nenhuma variável de ambiente adicional. As palavras-chave sugeridas e o
volume/concorrência mostrados são ESTIMATIVAS geradas por IA
(`src/lib/ai/seo-keywords-prompt.ts`), nunca dado real do Google — a
interface rotula isso explicitamente. (Uma integração real com o Google
Ads Keyword Planner foi avaliada e descontinuada por decisão do usuário,
pela complexidade de credenciais/aprovação exigida pela API do Google.)

## 6. Testes

`npm run test` roda Vitest sobre `src/tests/**/*.test.{ts,tsx}` (ambiente
jsdom, Testing Library, mock de `"server-only"` para rodar fora do
bundler do Next.js — ver `src/tests/mocks/server-only.ts`). Cobertura via
`npm run test:coverage`.

## 7. Lacunas conhecidas / próximos passos

Em ordem sugerida de implementação, cada um exigindo sua própria auditoria
de segurança/performance antes de produção:

Itens 1 a 5 do plano original (motor de perguntas adaptativas, score
determinístico, geração do plano por IA, tela de resultado + PDF,
integração com RD Station) já foram implementados nas etapas seguintes a
esta auditoria — este documento não foi atualizado etapa a etapa; para o
estado atual de cada área, veja o `README.md` de cada diretório
(`src/lib/calculations`, `src/lib/rd-station`, etc.) e os checklists em
`docs/`.

Lacuna conhecida que **continua em aberto**: não existe, em nenhuma tela
do produto, captura de consentimento LGPD explícito do lead
(`leads.consent_given` nunca é setado para `true`). Isso bloqueia
silenciosamente o envio ao RD Station (que exige esse consentimento antes
de enviar — ver `docs/CHECKLIST-RD-STATION.md`) e não tem nenhuma outra
consequência hoje, já que nenhuma outra parte do produto depende desse
campo.

A implementação anterior (arquivada em `_archived-legacy-root-app/`) tinha
uma versão funcional — porém com lacunas de segurança relevantes (RLS
aberto, sem rate limiting, sem validação de ambiente, integração RD
Station via OAuth/Bearer em vez do endpoint de Conversão via API Key) —
de boa parte desses itens, e pode servir de referência de abordagem, mas
não deve ser portada como está: precisa ser adaptada à camada de dados e
ao modelo de segurança de `src/`.
