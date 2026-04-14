package results

import (
	"context"
	"fmt"
	"time"
)

// --- Report Summary ---

type ReportSummary struct {
	Period         string      `json:"period"`
	From           time.Time   `json:"from"`
	To             time.Time   `json:"to"`
	TotalResults   int         `json:"total_results"`
	CompletedCount int         `json:"completed_count"`
	IncompleteCount int        `json:"incomplete_count"`
	CompletionRate float64     `json:"completion_rate"`
	PerDay         []DayStat   `json:"per_day"`
	TopFields      []FieldStat `json:"top_fields"`
	TopValues      []TopValue  `json:"top_values"`
	Rows           []ReportRow `json:"rows"`
}

type TopValue struct {
	Field string `json:"field"`
	Value string `json:"value"`
	Count int    `json:"count"`
}

type ReportRow struct {
	CreatedAt   string            `json:"created_at"`
	IsCompleted bool              `json:"is_completed"`
	Fields      map[string]string `json:"fields"`
}

func (r *Repository) GetReportSummary(ctx context.Context, from, to time.Time) (*ReportSummary, error) {
	summary := &ReportSummary{
		From: from,
		To:   to,
	}

	// Main counts
	err := r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE is_completed),
			COALESCE(ROUND(
				COUNT(*) FILTER (WHERE is_completed)::numeric / NULLIF(COUNT(*), 0) * 100, 1
			), 0)
		FROM results
		WHERE created_at_bot >= $1 AND created_at_bot < $2
	`, from, to).Scan(&summary.TotalResults, &summary.CompletedCount, &summary.CompletionRate)
	if err != nil {
		return nil, fmt.Errorf("summary counts: %w", err)
	}
	summary.IncompleteCount = summary.TotalResults - summary.CompletedCount

	// Per day
	rows, err := r.db.QueryContext(ctx, `
		SELECT DATE(created_at_bot)::text, COUNT(*)
		FROM results
		WHERE created_at_bot >= $1 AND created_at_bot < $2
		GROUP BY DATE(created_at_bot)
		ORDER BY DATE(created_at_bot)
	`, from, to)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d DayStat
			rows.Scan(&d.Date, &d.Count)
			summary.PerDay = append(summary.PerDay, d)
		}
	}

	// Top fields
	frows, err := r.db.QueryContext(ctx, `
		SELECT a.field_key, COUNT(DISTINCT a.result_id) as cnt
		FROM answers a
		JOIN results res ON res.id = a.result_id
		WHERE res.created_at_bot >= $1 AND res.created_at_bot < $2
		AND a.field_key != ''
		GROUP BY a.field_key
		ORDER BY cnt DESC
		LIMIT 10
	`, from, to)
	if err == nil {
		defer frows.Close()
		for frows.Next() {
			var f FieldStat
			frows.Scan(&f.FieldKey, &f.Count)
			summary.TopFields = append(summary.TopFields, f)
		}
	}

	// Top values for most common field
	if len(summary.TopFields) > 0 {
		topField := summary.TopFields[0].FieldKey
		vrows, err := r.db.QueryContext(ctx, `
			SELECT field_value, COUNT(*) as cnt
			FROM answers a
			JOIN results res ON res.id = a.result_id
			WHERE res.created_at_bot >= $1 AND res.created_at_bot < $2
			AND a.field_key = $3
			AND field_value != ''
			GROUP BY field_value
			ORDER BY cnt DESC
			LIMIT 8
		`, from, to, topField)
		if err == nil {
			defer vrows.Close()
			for vrows.Next() {
				var tv TopValue
				tv.Field = topField
				vrows.Scan(&tv.Value, &tv.Count)
				summary.TopValues = append(summary.TopValues, tv)
			}
		}
	}

	// Rows for export (all results in period with their fields)
	resRows, err := r.db.QueryContext(ctx, `
		SELECT r.id, r.created_at_bot, r.is_completed
		FROM results r
		WHERE r.created_at_bot >= $1 AND r.created_at_bot < $2
		ORDER BY r.created_at_bot DESC
		LIMIT 5000
	`, from, to)
	if err != nil {
		return summary, nil
	}
	defer resRows.Close()

	var resultIDs []string
	type tempRow struct {
		id          string
		createdAt   *time.Time
		isCompleted bool
	}
	var tempRows []tempRow

	for resRows.Next() {
		var tr tempRow
		resRows.Scan(&tr.id, &tr.createdAt, &tr.isCompleted)
		tempRows = append(tempRows, tr)
		resultIDs = append(resultIDs, tr.id)
	}

	// Build field map
	fieldMap := map[string]map[string]string{}
	if len(resultIDs) > 0 {
		placeholders := ""
		answerArgs := make([]interface{}, len(resultIDs))
		for i, id := range resultIDs {
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
		`, placeholders), answerArgs...)
		if err == nil {
			defer arows.Close()
			for arows.Next() {
				var rid, key, val string
				if arows.Scan(&rid, &key, &val) == nil {
					if fieldMap[rid] == nil {
						fieldMap[rid] = map[string]string{}
					}
					fieldMap[rid][key] = val
				}
			}
		}
	}

	for _, tr := range tempRows {
		dateStr := ""
		if tr.createdAt != nil {
			dateStr = tr.createdAt.In(time.FixedZone("BRT", -3*3600)).Format("02/01/2006 15:04")
		}
		row := ReportRow{
			CreatedAt:   dateStr,
			IsCompleted: tr.isCompleted,
			Fields:      fieldMap[tr.id],
		}
		if row.Fields == nil {
			row.Fields = map[string]string{}
		}
		summary.Rows = append(summary.Rows, row)
	}

	return summary, nil
}
