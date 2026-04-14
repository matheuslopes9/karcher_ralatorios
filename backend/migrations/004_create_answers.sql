-- Migration 004: Create answers table

CREATE TABLE answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id   UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    block_id    VARCHAR(255),
    step_id     VARCHAR(255),
    field_key   VARCHAR(255),
    field_value TEXT,
    answered_at TIMESTAMPTZ
);

CREATE INDEX idx_answers_result_id ON answers(result_id);
CREATE INDEX idx_answers_field_key ON answers(field_key);
CREATE INDEX idx_answers_answered_at ON answers(answered_at);
