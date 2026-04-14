-- Migration 005: Create analysis_snapshots table

CREATE TABLE analysis_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_at         TIMESTAMPTZ DEFAULT NOW(),
    period_start        TIMESTAMPTZ,
    period_end          TIMESTAMPTZ,
    total_results       INTEGER,
    completed_count     INTEGER,
    incomplete_count    INTEGER,
    completion_rate     DECIMAL(5,2),
    avg_duration_secs   INTEGER,
    drop_off_by_step    JSONB,
    top_answers         JSONB,
    hourly_distribution JSONB,
    compared_to_prev    JSONB
);

CREATE INDEX idx_snapshots_snapshot_at ON analysis_snapshots(snapshot_at);
CREATE INDEX idx_snapshots_period ON analysis_snapshots(period_start, period_end);
