# Plano Comercial Inteligente em 90 Dias™

Diagnóstico comercial B2B: a empresa informa dados básicos, o site é
analisado automaticamente por IA para pré-preencher o perfil, a pessoa
escolhe o principal desafio comercial e (quando o restante da jornada
estiver implementado) recebe um plano de 90 dias priorizado.

> **Estado atual: em construção.** Este repositório contém a base técnica
> (segurança, dados, infraestrutura) e a primeira metade da jornada do
> usuário. Veja [Estado da jornada](#estado-da-jornada) antes de planejar
> um deploy de produção.

## Stack

- Next.js 16 (App Router) + TypeScript, React 19
- Tailwind CSS v4 + componentes estilo shadcn/ui + Framer Motion
- Supabase (Postgres + Row Level Security)
- OpenAI (`openai`) — extração estruturada via function calling (tool use)
- Cheerio (parsing HTML) + guarda de SSRF própria para análise de site
- Vitest + Testing Library
- Deploy: Vercel

## Setup rápido

```bash
cp .env.example .env.local
# preencha as variáveis (ver .env.example para o que cada uma faz)
npm install
```

Depois, no Supabase (projeto novo ou existente):

1. Cole o conteúdo de `supabase/schema.sql` no SQL Editor e execute.
2. (Quando o PDF for implementado) crie o bucket privado `pdf-reports` em
   Storage — instruções no fim do próprio `schema.sql`.

Rode localmente:

```bash
npm run dev        # http://localhost:3000
npm run test        # testes (Vitest)
npm run lint         # ESLint
```

Veja também `docs/CHECKLIST-DEPLOY-VERCEL.md` e
`docs/CHECKLIST-SUPABASE.md` antes de publicar em produção.

## Estrutura

```
src/app/            # Rotas (App Router)
src/components/      # UI: layout, diagnostic, ui (primitivos)
src/server/           # Casos de uso server-only + Server Actions (src/server/actions)
src/lib/               # Supabase, IA, validação, análise de site, segurança, banco
src/config/             # Variáveis de ambiente validadas por Zod (client/server)
src/types/               # Tipos do banco (Database) e atalhos por tabela
src/tests/                # Testes (Vitest + Testing Library)
supabase/                  # schema.sql — schema completo do banco
docs/                        # Documentação técnica e checklists de deploy
_archived-legacy-root-app/    # Implementação anterior, arquivada (ver nota abaixo)
```

### Sobre `_archived-legacy-root-app/`

Este projeto continha duas implementações paralelas e incompatíveis no
mesmo diretório: uma árvore na raiz (`app/`, `components/`, `services/`...)
mais antiga e mais simples, e a árvore `src/` — mais recente, com proteção
SSRF, validação de ambiente e uma camada de dados completa. O Next.js não
builda com `app/` e `src/app/` coexistindo, então a árvore da raiz foi
movida para `_archived-legacy-root-app/` como referência histórica; ela
**não faz parte do build** (excluída em `tsconfig.json`). Continha a
implementação do motor de score, geração de plano por IA (OpenAI),
geração de PDF e envio para o RD Station — nenhuma dessas partes existe
ainda em `src/` (ver seção seguinte).

## Estado da jornada

Implementado em `src/`:

1. Tela de promessa → captura inicial (empresa, site opcional, e-mail).
2. Análise automática do site (crawl com proteção SSRF + extração
   estruturada por IA), com confirmação/edição pela pessoa usuária, e
   fallback honesto quando não há site ou a análise falha.
3. Escolha do principal desafio comercial (6 opções, acessível via
   teclado/leitor de tela).

**Ainda não implementado** (a própria base de código sinaliza isso — veja
os `README.md` em `src/lib/calculations/`, `src/lib/rd-station/`,
`src/components/result/` e `src/schemas/`):

- Perguntas adaptativas de meta e funil (o restante da jornada de
  diagnóstico).
- Motor determinístico de score, confiança e identificação de gargalo.
- Geração do plano de 90 dias por IA e seus schemas de validação.
- Tela de resultado e o PDF espelhando o mesmo conteúdo.
- Integração com RD Station (envio de lead + campos customizados).

Ou seja: hoje é possível preencher a jornada até a escolha do desafio; a
partir daí, a pessoa vê uma tela de "essas próximas perguntas ainda estão
em desenvolvimento". **Não publique isto como o funil completo em
produção** — trate como uma base para continuar construindo, ou publique
deliberadamente como uma etapa antecipada (ex.: lista de espera) se fizer
sentido para o negócio.

## Segurança (resumo — detalhes em `docs/TECHNICAL.md`)

- Nenhuma chave de API roda no navegador: `AI_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` e as variáveis do RD Station só existem em
  módulos marcados `import "server-only"`.
- Toda escrita/leitura no Supabase passa pelo cliente `service_role`
  (`src/lib/supabase/admin.ts`), nunca pela chave anônima do navegador —
  por isso o RLS de todas as tabelas nega tudo por padrão (ver comentário
  no topo de `supabase/schema.sql`).
- Análise de site protegida contra SSRF: protocolo restrito, bloqueio de
  IPs privados/metadados de nuvem, DNS pinado contra rebinding, limite de
  tamanho/tempo de resposta (`src/lib/security/safe-fetch.ts` +
  `url-guard.ts`).
- Conteúdo de sites de terceiros é tratado como dado não confiável na
  chamada de IA (delimitado, instrução explícita para ignorar comandos
  embutidos) e a saída da IA é sempre revalidada por schema Zod estrito no
  servidor — nunca só confiada.
- Rate limiting por IP no formulário público de entrada
  (`src/lib/security/rate-limit.ts`), para conter abuso que geraria custo
  de IA/crawl.
- Consentimento LGPD é versionado (`leads.consent_given` +
  `consent_version`), nunca só um booleano solto.
