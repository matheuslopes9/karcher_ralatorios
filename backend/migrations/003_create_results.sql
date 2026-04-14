-- Migration 003: Create results table

CREATE TABLE results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    typebot_id      VARCHAR(255) NOT NULL,
    result_id       VARCHAR(255) UNIQUE NOT NULL,
    created_at_bot  TIMESTAMPTZ,
    collected_at    TIMESTAMPTZ DEFAULT NOW(),
    is_completed    BOOLEAN DEFAULT FALSE,
    duration_secs   INTEGER,
    raw_data        JSONB,
    processed       BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_results_typebot_id ON results(typebot_id);
CREATE INDEX idx_results_created_at ON results(created_at_bot);
CREATE INDEX idx_results_completed ON results(is_completed);
CREATE INDEX idx_results_processed ON results(processed);
