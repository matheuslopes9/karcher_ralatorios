-- Migration 006: Create saved_reports table

CREATE TABLE saved_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    filters         JSONB,
    columns         JSONB,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_generated  TIMESTAMPTZ,
    schedule        VARCHAR(50),
    format_default  VARCHAR(10) DEFAULT 'xlsx'
);

CREATE INDEX idx_reports_created_by ON saved_reports(created_by);
CREATE INDEX idx_reports_created_at ON saved_reports(created_at);
