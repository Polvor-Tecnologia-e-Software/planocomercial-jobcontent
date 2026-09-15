-- Plano Comercial Inteligente em 90 Dias™ — Supabase Schema
-- Gera as tabelas usadas por src/lib/database/*.ts (ver src/types/database.ts,
-- que é a fonte de verdade dos tipos TypeScript espelhados aqui).
--
-- Execute este arquivo inteiro no Supabase SQL Editor de um projeto novo.
-- Depois de rodar, regenere os tipos TypeScript com:
--   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
--
-- MODELO DE ACESSO (importante, leia antes de alterar qualquer política):
-- Toda a aplicação acessa este banco exclusivamente pelo cliente Supabase
-- "admin" (chave service_role, ver src/lib/supabase/admin.ts), sempre a
-- partir de Server Actions/Route Handlers — nunca do navegador. A
-- service_role IGNORA Row Level Security. Por isso, todas as tabelas abaixo
-- têm RLS habilitado mas SEM NENHUMA policy para as roles "anon"/
-- "authenticated": o padrão do Postgres é negar tudo na ausência de policy,
-- então isso bloqueia completamente qualquer leitura/escrita feita com a
-- chave anônima (NEXT_PUBLIC_SUPABASE_ANON_KEY), que é pública por natureza
-- (fica embutida no bundle enviado ao navegador). Nunca crie uma policy
-- "USING (true)" nestas tabelas — isso reabriria a tabela inteira (incluindo
-- e-mail/telefone de leads) para qualquer pessoa com essa chave.

-- ─── Extensões ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ─── Função utilitária: normalize_website ──────────────────────────────────────
-- Espelhada em TypeScript por src/lib/database/normalize-website.ts — mantenha
-- as duas em sincronia caso uma mude. Usada por um trigger em "companies" e
-- pelas buscas de deduplicação de empresa por site.
create or replace function normalize_website(raw_url text)
returns text
language plpgsql
immutable
as $$
declare
  result text;
begin
  if raw_url is null or btrim(raw_url) = '' then
    return null;
  end if;

  result := lower(btrim(raw_url));
  result := regexp_replace(result, '^[a-z][a-z0-9+.-]*://', '');
  result := regexp_replace(result, '^www\.', '');
  result := regexp_replace(result, '/+$', '');
  result := split_part(result, '/', 1);
  result := split_part(result, '?', 1);

  if result = '' then
    return null;
  end if;

  return result;
end;
$$;

create or replace function set_normalized_website()
returns trigger
language plpgsql
as $$
begin
  new.normalized_website := normalize_website(new.website);
  return new;
end;
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── companies ──────────────────────────────────────────────────────────────
create table companies (
  id                     uuid primary key default gen_random_uuid(),
  company_name           text not null,
  website                text,
  normalized_website     text,
  segment                text,
  description            text,
  main_offer             text,
  target_audience        text,
  business_model         text,
  average_ticket         numeric(14, 2),
  sales_cycle            text,
  -- 5-10 palavras-chave que resumem o negócio, informadas na captura
  -- inicial (seção de SEO) — array de strings, mesma convenção de
  -- differentiators/commercial_proofs abaixo.
  keywords               jsonb not null default '[]',
  differentiators        jsonb not null default '[]',
  commercial_proofs      jsonb not null default '[]',
  conversion_mechanisms  jsonb not null default '[]',
  profile_sources        jsonb not null default '{}',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_companies_normalized_website on companies (normalized_website);

create trigger trg_companies_normalized_website
  before insert or update of website on companies
  for each row execute function set_normalized_website();

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

alter table companies enable row level security;

-- ─── leads ──────────────────────────────────────────────────────────────────
create table leads (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies (id) on delete cascade,
  name              text,
  email             text,
  phone             text,
  job_title         text,
  consent_given     boolean not null default false,
  consent_version   text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_leads_company_id on leads (company_id);
create index idx_leads_email on leads (email);

create trigger trg_leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

-- ─── diagnostics ────────────────────────────────────────────────────────────
create table diagnostics (
  id                        uuid primary key default gen_random_uuid(),
  company_id                uuid not null references companies (id) on delete cascade,
  lead_id                   uuid references leads (id) on delete set null,
  status                    text not null default 'started' check (status in (
                              'started', 'company_analyzing', 'company_confirmed',
                              'challenge_selected', 'goal_defined', 'adaptive_in_progress',
                              'prediagnosis_ready', 'lead_captured', 'generating',
                              'completed', 'failed'
                            )),
  selected_challenge        text check (selected_challenge in ('D1', 'D2', 'D3', 'D4', 'D5', 'D6')),
  current_step              text,
  overall_score             numeric(5, 2),
  maturity_stage            text,
  primary_bottleneck        text check (primary_bottleneck in (
                              'demand', 'conversion', 'processes', 'management',
                              'scale', 'digital_positioning'
                            )),
  secondary_risk            text check (secondary_risk in (
                              'demand', 'conversion', 'processes', 'management',
                              'scale', 'digital_positioning'
                            )),
  data_quality_percentage   numeric(5, 2),
  confidence_level          text check (confidence_level in ('low', 'medium', 'high')),
  started_at                timestamptz not null default now(),
  completed_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_diagnostics_company_id on diagnostics (company_id);
create index idx_diagnostics_lead_id on diagnostics (lead_id);
create index idx_diagnostics_status on diagnostics (status);

create trigger trg_diagnostics_updated_at
  before update on diagnostics
  for each row execute function set_updated_at();

alter table diagnostics enable row level security;

-- ─── diagnostic_answers ─────────────────────────────────────────────────────
create table diagnostic_answers (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  question_key    text not null,
  answer_value    jsonb not null,
  answer_source   text not null default 'user' check (answer_source in (
                    'user', 'site_confirmed', 'site_inference', 'calculated'
                  )),
  confirmed       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (diagnostic_id, question_key)
);

create index idx_diagnostic_answers_diagnostic_id on diagnostic_answers (diagnostic_id);

create trigger trg_diagnostic_answers_updated_at
  before update on diagnostic_answers
  for each row execute function set_updated_at();

alter table diagnostic_answers enable row level security;

-- ─── site_analyses ──────────────────────────────────────────────────────────
create table site_analyses (
  id               uuid primary key default gen_random_uuid(),
  diagnostic_id    uuid not null references diagnostics (id) on delete cascade,
  normalized_url   text,
  status           text not null default 'not_started' check (status in (
                     'not_started', 'queued', 'processing', 'completed', 'partial',
                     'failed', 'confirmed', 'rejected', 'skipped'
                   )),
  content_hash     text,
  result_json      jsonb,
  pages            jsonb not null default '[]',
  warnings         jsonb not null default '[]',
  model            text,
  prompt_version   text,
  input_tokens     integer,
  output_tokens    integer,
  confidence       text check (confidence in ('low', 'medium', 'high')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_site_analyses_diagnostic_id on site_analyses (diagnostic_id);
-- Suporta o cache por URL + hash de conteúdo (findCachedAnalysis).
create index idx_site_analyses_cache_lookup
  on site_analyses (normalized_url, content_hash, status);

create trigger trg_site_analyses_updated_at
  before update on site_analyses
  for each row execute function set_updated_at();

alter table site_analyses enable row level security;

-- ─── seo_analyses ───────────────────────────────────────────────────────────
-- Oportunidades de SEO: a IA sugere palavras-chave relacionadas às
-- informadas na captura (companies.keywords), com estimativa de volume de
-- busca/concorrência (nunca dado real do Google — ver
-- src/lib/ai/seo-keywords-prompt.ts). O ranqueamento e a marcação de
-- cobertura continuam determinísticos do lado da aplicação, sobre as
-- estimativas da IA (ver src/lib/seo/keyword-opportunity.ts); mesmo padrão
-- de cache por hash de site_analyses, mas independente dela.
create table seo_analyses (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  status          text not null default 'not_started' check (status in (
                    'not_started', 'queued', 'processing', 'completed', 'failed', 'skipped'
                  )),
  -- Hash de (palavras-chave + site normalizado) — cache por diagnóstico
  -- com o mesmo insumo, mesma lógica de content_hash em site_analyses.
  content_hash    text,
  -- Array de { keyword, avgMonthlySearches, competition, opportunityRank }
  -- já ordenado — nunca reordenado/recalculado na tela ou no PDF.
  keyword_ideas   jsonb not null default '[]',
  warnings        jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_seo_analyses_diagnostic_id on seo_analyses (diagnostic_id);

create trigger trg_seo_analyses_updated_at
  before update on seo_analyses
  for each row execute function set_updated_at();

alter table seo_analyses enable row level security;

-- ─── funnel_analyses ────────────────────────────────────────────────────────
create table funnel_analyses (
  id                        uuid primary key default gen_random_uuid(),
  diagnostic_id             uuid not null references diagnostics (id) on delete cascade,
  current_funnel            jsonb not null default '{}',
  required_funnel           jsonb not null default '{}',
  conversion_rates          jsonb not null default '{}',
  gaps                      jsonb not null default '{}',
  assumptions               jsonb not null default '[]',
  missing_data              jsonb not null default '[]',
  completeness_percentage   numeric(5, 2),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  -- Obrigatória: src/lib/database/funnel-analyses.ts (upsertFunnelAnalysis)
  -- faz upsert com onConflict: "diagnostic_id" — sem esta constraint, essa
  -- chamada falha em um Postgres real ("no unique or exclusion constraint
  -- matching the ON CONFLICT specification"), quebrando o motor
  -- determinístico (Etapa 2) toda vez que ele grava/regrava o funil de um
  -- diagnóstico. Achado na auditoria final — corrigido aqui.
  unique (diagnostic_id)
);

create index idx_funnel_analyses_diagnostic_id on funnel_analyses (diagnostic_id);

create trigger trg_funnel_analyses_updated_at
  before update on funnel_analyses
  for each row execute function set_updated_at();

alter table funnel_analyses enable row level security;

-- ─── diagnostic_scores ──────────────────────────────────────────────────────
create table diagnostic_scores (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  dimension       text not null check (dimension in (
                    'demand', 'conversion', 'processes', 'management',
                    'scale', 'digital_positioning'
                  )),
  score           numeric(5, 2) not null,
  weight          numeric(5, 2) not null,
  evidence        jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  unique (diagnostic_id, dimension)
);

create index idx_diagnostic_scores_diagnostic_id on diagnostic_scores (diagnostic_id);

alter table diagnostic_scores enable row level security;

-- ─── diagnostic_signals ─────────────────────────────────────────────────────
create table diagnostic_signals (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  signal_code     text not null,
  dimension       text check (dimension in (
                    'demand', 'conversion', 'processes', 'management',
                    'scale', 'digital_positioning'
                  )),
  severity        text not null default 'low' check (severity in ('low', 'medium', 'high')),
  evidence        jsonb not null default '[]',
  created_at      timestamptz not null default now()
);

create index idx_diagnostic_signals_diagnostic_id on diagnostic_signals (diagnostic_id);

alter table diagnostic_signals enable row level security;

-- ─── action_library ─────────────────────────────────────────────────────────
create table action_library (
  id                    uuid primary key default gen_random_uuid(),
  action_code           text not null unique,
  title                 text not null,
  description           text,
  dimension             text not null check (dimension in (
                          'demand', 'conversion', 'processes', 'management',
                          'scale', 'digital_positioning'
                        )),
  bottleneck_type       text,
  funnel_stage          text,
  default_phase         text not null check (default_phase in ('days_1_30', 'days_31_60', 'days_61_90')),
  default_owner         text not null,
  default_indicator     text,
  completion_criteria   text,
  dependencies          jsonb not null default '[]',
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_action_library_dimension on action_library (dimension) where is_active;

create trigger trg_action_library_updated_at
  before update on action_library
  for each row execute function set_updated_at();

alter table action_library enable row level security;

-- ─── diagnostic_actions ─────────────────────────────────────────────────────
create table diagnostic_actions (
  id                   uuid primary key default gen_random_uuid(),
  diagnostic_id        uuid not null references diagnostics (id) on delete cascade,
  action_library_id    uuid not null references action_library (id) on delete restrict,
  phase                text not null check (phase in ('days_1_30', 'days_31_60', 'days_61_90')),
  priority_order       integer not null,
  custom_context       text,
  generated_content    jsonb,
  created_at           timestamptz not null default now()
);

create index idx_diagnostic_actions_diagnostic_id on diagnostic_actions (diagnostic_id);

alter table diagnostic_actions enable row level security;

-- ─── ai_reports ─────────────────────────────────────────────────────────────
create table ai_reports (
  id               uuid primary key default gen_random_uuid(),
  diagnostic_id    uuid not null references diagnostics (id) on delete cascade,
  report_type      text not null check (report_type in (
                     'site_analysis', 'prediagnosis', 'diagnostic_plan', 'partial_regeneration'
                   )),
  status           text not null default 'queued' check (status in (
                     'queued', 'generating', 'validated', 'failed', 'retrying'
                   )),
  model            text,
  prompt_version   text,
  input_hash       text,
  response_json    jsonb,
  input_tokens     integer,
  output_tokens    integer,
  estimated_cost   numeric(10, 6),
  latency_ms       integer,
  cached           boolean not null default false,
  -- Motivo legível da falha (ex.: "invalid_output", "transport_error") —
  -- null enquanto o relatório não falhou. Nunca guarda o erro bruto do
  -- SDK nem qualquer segredo (ver src/server/generate-commercial-plan.ts).
  last_error       text,
  created_at       timestamptz not null default now()
);

create index idx_ai_reports_diagnostic_id on ai_reports (diagnostic_id);

alter table ai_reports enable row level security;

-- ─── pdf_reports ────────────────────────────────────────────────────────────
create table pdf_reports (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  storage_path    text not null,
  -- Hash do CONTEÚDO usado para gerar este PDF (plano + funil + versão do
  -- template) — usado para decidir se um PDF já gerado ainda é válido,
  -- sem precisar reabrir o arquivo. Diferente de file_hash (abaixo).
  report_hash     text,
  -- Versão do layout/template do PDF (src/lib/pdf/commercial-plan-document.tsx)
  -- — muda o hash mesmo se o conteúdo do plano for idêntico, para forçar
  -- regeneração quando o layout mudar.
  template_version text,
  -- Hash do ARQUIVO PDF já renderizado (bytes), para verificar integridade
  -- — não decide cache, só serve de checagem.
  file_hash       text,
  file_size       integer,
  version         integer not null default 1,
  status          text not null default 'queued' check (status in (
                    'queued', 'generating', 'stored', 'available', 'failed'
                  )),
  created_at      timestamptz not null default now()
);

create index idx_pdf_reports_diagnostic_id on pdf_reports (diagnostic_id);

alter table pdf_reports enable row level security;

-- ─── rd_integrations ────────────────────────────────────────────────────────
create table rd_integrations (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  lead_id         uuid references leads (id) on delete set null,
  event_name      text not null,
  payload         jsonb not null default '{}',
  status          text not null default 'pending' check (status in (
                    'pending', 'sent', 'failed', 'retrying'
                  )),
  attempts        integer not null default 0,
  last_error      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Garante que só existe um evento por diagnóstico (ex.: um registro de
  -- "plano-comercial-90-dias" por diagnostic_id) — é o que torna o envio
  -- idempotente de verdade: duas chamadas concorrentes (clique duplo, duas
  -- abas, retry) tentam inserir a mesma linha e a segunda falha com
  -- violação de unicidade (código 23505), que o código trata como "outra
  -- chamada já está cuidando disso" em vez de duplicar o envio (ver
  -- src/lib/database/rd-integrations.ts, createIntegrationIfAbsent).
  unique (diagnostic_id, event_name)
);

create index idx_rd_integrations_diagnostic_id on rd_integrations (diagnostic_id);
create index idx_rd_integrations_status on rd_integrations (status);

create trigger trg_rd_integrations_updated_at
  before update on rd_integrations
  for each row execute function set_updated_at();

alter table rd_integrations enable row level security;

-- ─── analytics_events ───────────────────────────────────────────────────────
create table analytics_events (
  id              uuid primary key default gen_random_uuid(),
  diagnostic_id   uuid not null references diagnostics (id) on delete cascade,
  event_name      text not null,
  event_data      jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index idx_analytics_events_diagnostic_id on analytics_events (diagnostic_id);
create index idx_analytics_events_event_name on analytics_events (event_name);

alter table analytics_events enable row level security;

-- ─── rate_limits ────────────────────────────────────────────────────────────
-- Suporte ao rate limiting de Server Actions/rotas (ver src/lib/security/rate-limit.ts).
-- "key" combina a ação e um identificador do chamador (ex.: IP), ex.:
-- "start_diagnostic:203.0.113.4". Cada linha representa uma janela fixa de
-- tempo; o app decide o tamanho da janela e o limite por chamada.
create table rate_limits (
  key            text primary key,
  window_start   timestamptz not null,
  count          integer not null default 1
);

alter table rate_limits enable row level security;

-- Incrementa (ou inicia) o contador de uma janela e devolve o novo total,
-- de forma atômica — evita que requisições concorrentes do mesmo IP
-- burlem o limite por condição de corrida (ver src/lib/security/rate-limit.ts).
-- "security definer" é necessário porque a role usada pela aplicação
-- (service_role) já ignora RLS, mas isso deixa explícito que a função
-- sempre roda com os privilégios de quem a definiu, não de quem a chama.
create or replace function increment_rate_limit(p_key text, p_window_start timestamptz)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into rate_limits (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key) do update set count = rate_limits.count + 1
  returning count;
$$;

-- Recomendado: apague periodicamente janelas antigas para a tabela não
-- crescer indefinidamente, ex. via pg_cron (Supabase > Database > Cron):
--   select cron.schedule('cleanup_rate_limits', '0 * * * *',
--     $$ delete from rate_limits where window_start < now() - interval '1 day' $$);

-- ─── Supabase Storage: bucket de PDFs (usado por
-- src/server/generate-commercial-plan-pdf.tsx) ─────────────────────────────
-- Criar manualmente em Storage > New Bucket (não é criado por este script):
--   Nome: pdf-reports
--   Público: não (privado — acesso somente via signed URL)
--   Limite de tamanho de arquivo: 10MB
--   Tipos MIME permitidos: application/pdf
-- Ver docs/CHECKLIST-SUPABASE.md para o passo a passo completo.

-- ─── Projeto Supabase já provisionado antes desta auditoria? ───────────────
-- Se você já rodou uma versão anterior deste schema.sql (sem a linha
-- "unique (diagnostic_id)" em funnel_analyses, adicionada nesta auditoria
-- final), rode manualmente para corrigir o bug descrito ali:
--   alter table funnel_analyses add constraint funnel_analyses_diagnostic_id_key unique (diagnostic_id);
-- Sem isso, upsertFunnelAnalysis() falha em produção.
