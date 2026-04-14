package results

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// --- Dashboard ---

type OverviewStats struct {
	TotalResults   int     `json:"total_results"`
	CompletedCount int     `json:"completed_count"`
	CompletionRate float64 `json:"completion_rate"`
	AvgDuration    int     `json:"avg_duration"`
	VsYesterday    float64 `json:"vs_yesterday"`
}

func (r *Repository) GetOverview(ctx context.Context) (*OverviewStats, error) {
	stats := &OverviewStats{}

	err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE is_completed = TRUE) AS completed,
			COALESCE(ROUND(
				COUNT(*) FILTER (WHERE is_completed = TRUE)::numeric /
				NULLIF(COUNT(*), 0) * 100, 1
			), 0) AS rate,
			COALESCE(AVG(duration_secs) FILTER (WHERE duration_secs > 0), 0)::int AS avg_dur
		FROM results
	`).Scan(&stats.TotalResults, &stats.CompletedCount, &stats.CompletionRate, &stats.AvgDuration)
	if err != nil {
		return stats, err
	}

	// vs yesterday
	today := time.Now().Truncate(24 * time.Hour)
	yesterday := today.Add(-24 * time.Hour)

	var todayCount, yesterdayCount int
	r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM results WHERE created_at_bot >= $1`, today).Scan(&todayCount)
	r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM results WHERE created_at_bot >= $1 AND created_at_bot < $2`, yesterday, today).Scan(&yesterdayCount)

	if yesterdayCount > 0 {
		stats.VsYesterday = float64(todayCount-yesterdayCount) / float64(yesterdayCount) * 100
	}

	return stats, nil
}

// --- Results list ---

type AnswerField struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type ResultRow struct {
	ID           string        `json:"id"`
	ResultID     string        `json:"result_id"`
	CreatedAtBot *time.Time    `json:"created_at"`
	IsCompleted  bool          `json:"is_completed"`
	DurationSecs int           `json:"duration_secs"`
	Fields       []AnswerField `json:"fields"`
}

func (r *Repository) ListResults(ctx context.Context, page, limit int, onlyCompleted *bool, search string) ([]ResultRow, int, error) {
	where := "1=1"
	args := []interface{}{}
	n := 1

	if onlyCompleted != nil {
		where += fmt.Sprintf(" AND r.is_completed = $%d", n)
		args = append(args, *onlyCompleted)
		n++
	}

	if search != "" {
		where += fmt.Sprintf(` AND EXISTS (
			SELECT 1 FROM answers a2
			WHERE a2.result_id = r.id
			AND (LOWER(a2.field_value) LIKE LOWER($%d) OR LOWER(a2.field_key) LIKE LOWER($%d))
		)`, n, n)
		args = append(args, "%"+search+"%")
		n++
	}

	var total int
	r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM results r WHERE `+where, args...).Scan(&total)

	args = append(args, limit, (page-1)*limit)
	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT r.id, r.result_id, r.created_at_bot, r.is_completed, COALESCE(r.duration_secs, 0)
		FROM results r
		WHERE %s
		ORDER BY r.created_at_bot DESC
		LIMIT $%d OFFSET $%d
	`, where, n, n+1), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []ResultRow
	var ids []string
	for rows.Next() {
		var row ResultRow
		if err := rows.Scan(&row.ID, &row.ResultID, &row.CreatedAtBot, &row.IsCompleted, &row.DurationSecs); err != nil {
			continue
		}
		list = append(list, row)
		ids = append(ids, row.ID)
	}

	// Busca os campos (answers) para cada resultado
	if len(ids) > 0 {
		placeholders := ""
		answerArgs := make([]interface{}, len(ids))
		for i, id := range ids {
			if i > 0 {
				placeholders += ","
			}
			placeholders += fmt.Sprintf("$%d", i+1)
			answerArgs[i] = id
		}

		arows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
			SELECT result_id, field_key, field_value
			FROM answers
			WHERE result_id IN (%s)
			ORDER BY result_id, id
		`, placeholders), answerArgs...)

		if err == nil {
			defer arows.Close()
			fieldMap := map[string][]AnswerField{}
			for arows.Next() {
				var rid, key, val string
				if arows.Scan(&rid, &key, &val) == nil {
					fieldMap[rid] = append(fieldMap[rid], AnswerField{Key: key, Value: val})
				}
			}
			for i := range list {
				if fields, ok := fieldMap[list[i].ID]; ok {
					list[i].Fields = fields
				} else {
					list[i].Fields = []AnswerField{}
				}
			}
		}
	}

	return list, total, nil
}

// --- Analytics ---

type AnalyticsSummary struct {
	Period         string  `json:"period"`
	TotalResults   int     `json:"total_results"`
	CompletionRate float64 `json:"completion_rate"`
	AvgDuration    int     `json:"avg_duration"`
	PerDay         []DayStat `json:"per_day"`
	TopAnswers     []FieldStat `json:"top_answers"`
}

type DayStat struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type FieldStat struct {
	FieldKey string `json:"field"`
	Count    int    `json:"count"`
}

func (r *Repository) GetAnalyticsSummary(ctx context.Context, period string) (*AnalyticsSummary, error) {
	summary := &AnalyticsSummary{Period: period}

	// Define window
	var since time.Time
	switch period {
	case "weekly":
		since = time.Now().Add(-7 * 24 * time.Hour)
	case "monthly":
		since = time.Now().Add(-30 * 24 * time.Hour)
	default: // daily
		since = time.Now().Add(-24 * time.Hour)
	}

	r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*),
			ROUND(COUNT(*) FILTER (WHERE is_completed)::numeric / NULLIF(COUNT(*),0) * 100, 1),
			COALESCE(AVG(duration_secs) FILTER (WHERE duration_secs > 0), 0)::int
		FROM results WHERE created_at_bot >= $1
	`, since).Scan(&summary.TotalResults, &summary.CompletionRate, &summary.AvgDuration)

	// Per day (last 30 days)
	rows, err := r.db.QueryContext(ctx, `
		SELECT DATE(created_at_bot)::text, COUNT(*)
		FROM results
		WHERE created_at_bot >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(created_at_bot)
		ORDER BY DATE(created_at_bot)
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d DayStat
			rows.Scan(&d.Date, &d.Count)
			summary.PerDay = append(summary.PerDay, d)
		}
	}

	// Top answer fields
	arows, err := r.db.QueryContext(ctx, `
		SELECT field_key, COUNT(*) as cnt
		FROM answers
		WHERE field_key != ''
		GROUP BY field_key
		ORDER BY cnt DESC
		LIMIT 10
	`)
	if err == nil {
		defer arows.Close()
		for arows.Next() {
			var f FieldStat
			arows.Scan(&f.FieldKey, &f.Count)
			summary.TopAnswers = append(summary.TopAnswers, f)
		}
	}

	return summary, nil
}
