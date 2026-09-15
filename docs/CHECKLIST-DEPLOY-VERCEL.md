# Checklist — Deploy na Vercel

## Antes do primeiro deploy

- [ ] **Rode `npm install` localmente e commite o `package-lock.json`
      novo.** As dependências de IA mudaram nesta etapa (`openai`
      adicionada, `@anthropic-ai/sdk` removida — o projeto migrou de
      Anthropic para OpenAI). Sem um lockfile atualizado e commitado, o
      build da Vercel roda `npm install` a cada deploy em vez de `npm
      ci`, o que é mais lento e menos reprodutível.
- [ ] Rode `npm run build` localmente e confirme que passa sem erros —
      este ambiente de auditoria não tinha Node.js instalado, então as
      correções de estrutura (tsconfig, dependências) não puderam ser
      validadas por um build real. Trate o primeiro `npm run build` local
      pós-auditoria como obrigatório, não opcional.
- [ ] Rode `npm run lint` e `npm run test` localmente.
- [ ] Execute `supabase/schema.sql` no projeto Supabase de produção (veja
      `CHECKLIST-SUPABASE.md`) **antes** de apontar o deploy para ele. Se
      o projeto já existia antes desta auditoria final, rode também o
      `alter table` de correção no fim de `supabase/schema.sql` (bug no
      upsert de `funnel_analyses`, ver seção "Projeto Supabase já
      provisionado" nesse arquivo).
- [ ] A jornada completa está implementada (tela inicial → captura →
      análise de site → confirmação → desafio → perguntas adaptativas →
      cálculos → IA → resultado → PDF → RD Station). Falta apenas: captura
      de consentimento LGPD explícito do lead (ver
      `docs/CHECKLIST-RD-STATION.md`, isso também bloqueia o envio ao RD
      Station). O catálogo de perguntas já cobre meta mensal, vendas
      atuais e o volume de cada estágio do funil (perguntas universais
      U4-U9, ver `src/lib/challenges/challenge-config.ts`) — corrigido
      numa etapa posterior a este checklist.

## Variáveis de ambiente no projeto Vercel

Configure em Project Settings → Environment Variables, para os ambientes
que fizerem sentido (Production / Preview / Development podem ter valores
diferentes — ex.: um projeto Supabase de staging para Preview).

| Variável | Obrigatória | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Pública — ok expor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Pública — protegida pelo RLS, nunca pela obscuridade |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | **Secreta.** Nunca prefixe com `NEXT_PUBLIC_` |
| `AI_API_KEY` | Sim | Chave da OpenAI. Secreta |
| `AI_MODEL` | Sim | Ex.: `gpt-4o` |
| `RD_STATION_API_KEY` | Opcional | Sem ela, a conversão ao RD Station fica desativada (nunca bloqueia o resto do produto). Secreta |
| `RD_STATION_CLIENT_ID/_SECRET/_REFRESH_TOKEN` | Opcional, reservada | Não usadas pela integração atual (API Key) — reservadas para uma eventual integração OAuth futura |
| `APP_URL` | Sim | URL pública do deploy (ex.: `https://seu-dominio.com`) |

- [ ] Nenhuma variável secreta (`SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`,
      `RD_STATION_*`) tem o prefixo `NEXT_PUBLIC_`. Confirme visualmente
      na lista da Vercel — um prefixo errado aqui vaza o segredo no bundle
      do navegador silenciosamente, sem erro de build.
- [ ] Ambiente de Preview aponta para um projeto Supabase **separado** do
      de produção (ou, no mínimo, para dados que podem ser
      perdidos/resetados) — Preview deployments costumam ser acessíveis
      publicamente por URL.

## Configuração do projeto

- [ ] Framework preset: Next.js (detectado automaticamente).
- [ ] Node.js version compatível com Next.js 16 (verifique a versão
      recomendada nas release notes do Next.js no momento do deploy).
- [ ] Domínio customizado configurado e `APP_URL` atualizado para
      corresponder exatamente (protocolo `https://`, sem barra final).
- [ ] Analytics/monitoring: configure alertas de erro (ex.: Vercel
      Observability, ou um serviço externo) — hoje os erros só vão para
      `console.error`, visível nos logs da Vercel mas sem alerta ativo.

## Segurança e limites

- [ ] Confirme que os headers de segurança em `next.config.ts`
      (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
      `Permissions-Policy`) chegam nas respostas de produção (inspecione
      com `curl -I` no domínio publicado).
- [ ] Avalie adicionar uma `Content-Security-Policy` — não incluída nesta
      auditoria por exigir ajuste fino contra os recursos reais da página
      (evite copiar uma CSP genérica sem testar, pois pode quebrar
      estilos/scripts inline usados pelo Tailwind/Framer Motion).
- [ ] Avalie ativar a [Vercel Web Application Firewall / Rate
      Limiting](https://vercel.com/docs/security) como camada adicional
      ao rate limiting por IP já implementado em
      `src/lib/security/rate-limit.ts` — especialmente útil contra tráfego
      distribuído em muitos IPs, que o limitador atual não distingue de
      tráfego orgânico.
- [ ] Avalie adicionar um CAPTCHA (ex.: Cloudflare Turnstile) ao
      formulário de entrada antes de campanhas de tráfego pago — reduz
      leads falsos e chamadas de IA desperdiçadas por bots. Não
      implementado nesta auditoria (ver `docs/TECHNICAL.md`, seção 4).

## Custos a monitorar

- [ ] Configure um limite de gasto/alerta na conta OpenAI — cada
      submissão do formulário de entrada aciona, na tela seguinte, uma
      chamada de IA (análise de site). O rate limiting reduz mas não
      elimina o risco de um pico de custo.
- [ ] Confirme o plano do Supabase suporta o volume esperado de linhas em
      `rate_limits` e `analytics_events` (as que mais crescem) — configure
      a limpeza periódica sugerida no fim de `supabase/schema.sql`
      (`pg_cron` ou um job externo) antes de ir ao ar, para essas tabelas
      não crescerem indefinidamente.

## Antes do primeiro deploy — configuração manual em serviços externos

Nenhum destes é criado automaticamente pelo código ou pelo schema:

- [ ] Bucket `pdf-reports` no Supabase Storage — passo a passo completo em
      `docs/CHECKLIST-SUPABASE.md`. **Privado**, nunca público.
- [ ] Campos personalizados no RD Station (se for usar a integração) —
      passo a passo completo em `docs/CHECKLIST-RD-STATION.md`.

## Depois do deploy

- [ ] Teste o fluxo completo manualmente em produção, do início ao fim:
      tela inicial → captura → análise de site (com um site real e sem
      site) → confirmação → escolha de desafio → perguntas adaptativas →
      resultado (gerar o plano) → baixar o PDF. Veja
      `docs/CHECKLIST-SUPABASE.md` e `docs/CHECKLIST-RD-STATION.md` para
      os testes específicos de PDF e RD Station.
- [ ] Teste em um celular real (não só DevTools) — toque, teclado virtual
      cobrindo campos, orientação retrato.
- [ ] Confirme que o rate limit dispara como esperado (ex.: envie o
      formulário 6 vezes seguidas do mesmo IP/rede).
- [ ] Confirme os cabeçalhos de segurança novos (`next.config.ts`) com
      `curl -I https://seu-dominio.com` — deve incluir `x-frame-options:
      DENY` e `x-content-type-options: nosniff`.
