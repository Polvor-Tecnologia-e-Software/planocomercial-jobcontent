-- Growth Planner B2B™ — Supabase Schema
-- Run this in Supabase SQL Editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Companies ───────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  website     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "public select companies" ON companies FOR SELECT USING (true);

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  role                  TEXT,
  lgpd_consent          BOOLEAN NOT NULL DEFAULT FALSE,
  lgpd_consent_at       TIMESTAMPTZ,
  lgpd_text_version     TEXT,
  lgpd_origin           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company_id ON leads(company_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "public select own leads" ON leads FOR SELECT USING (true);

-- ─── Diagnostics ─────────────────────────────────────────────────────────────
CREATE TABLE diagnostics (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id               UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_module        TEXT NOT NULL DEFAULT 'momento_atual',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX idx_diagnostics_lead_id ON diagnostics(lead_id);

ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all diagnostics" ON diagnostics FOR ALL USING (true);

-- ─── Diagnostic Answers ───────────────────────────────────────────────────────
CREATE TABLE diagnostic_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id   UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  question_id     TEXT NOT NULL,
  value           JSONB NOT NULL,  -- supports string, array, number
  score           NUMERIC(4,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diagnostic_answers_diagnostic_id ON diagnostic_answers(diagnostic_id);

ALTER TABLE diagnostic_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all diagnostic_answers" ON diagnostic_answers FOR ALL USING (true);

-- ─── Funnel Analysis ─────────────────────────────────────────────────────────
CREATE TABLE funnel_analysis (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id             UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  stages                    JSONB NOT NULL DEFAULT '[]',
  monthly_revenue_current   NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_revenue_potential NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE funnel_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all funnel_analysis" ON funnel_analysis FOR ALL USING (true);

-- ─── AI Reports ──────────────────────────────────────────────────────────────
CREATE TABLE ai_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id         UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  growth_score          INTEGER NOT NULL DEFAULT 0,
  score_demanda         INTEGER NOT NULL DEFAULT 0,
  score_conversao       INTEGER NOT NULL DEFAULT 0,
  score_escala          INTEGER NOT NULL DEFAULT 0,
  score_nivel           TEXT NOT NULL DEFAULT 'basico',
  gargalo_principal     TEXT NOT NULL DEFAULT 'demanda',
  executive_diagnosis   TEXT,
  plan_30_days          JSONB,
  plan_60_days          JSONB,
  plan_90_days          JSONB,
  content_ideas         JSONB DEFAULT '[]',
  rich_materials        JSONB DEFAULT '[]',
  email_cadences        JSONB DEFAULT '[]',
  whatsapp_cadences     JSONB DEFAULT '[]',
  model_used            TEXT DEFAULT 'gpt-4o-mini',
  tokens_input          INTEGER,
  tokens_output         INTEGER,
  cost_usd              NUMERIC(10,6),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_reports_diagnostic_id ON ai_reports(diagnostic_id);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all ai_reports" ON ai_reports FOR ALL USING (true);

-- ─── PDF Reports ─────────────────────────────────────────────────────────────
CREATE TABLE pdf_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id         UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  storage_path          TEXT NOT NULL,
  signed_url            TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pdf_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all pdf_reports" ON pdf_reports FOR ALL USING (true);

-- ─── RD Integrations ─────────────────────────────────────────────────────────
CREATE TABLE rd_integrations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  diagnostic_id     UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  rd_contact_id     TEXT,
  payload           JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rd_integrations_lead_id ON rd_integrations(lead_id);
CREATE INDEX idx_rd_integrations_status ON rd_integrations(status);

ALTER TABLE rd_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert rd_integrations" ON rd_integrations FOR INSERT WITH CHECK (true);

-- ─── Supabase Storage: PDF Bucket ────────────────────────────────────────────
-- Run in dashboard: Storage > New Bucket
-- Name: pdf-reports
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf
