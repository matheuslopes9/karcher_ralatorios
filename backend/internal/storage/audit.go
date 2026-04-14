package storage

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID        string                 `json:"id" db:"id"`
	UserID    string                 `json:"user_id" db:"user_id"`
	Username  string                 `json:"username" db:"username"`
	Action    string                 `json:"action" db:"action"`
	Resource  string                 `json:"resource" db:"resource"`
	ResourceID string                `json:"resource_id" db:"resource_id"`
	Details   map[string]interface{} `json:"details" db:"details"`
	IPAddress string                 `json:"ip_address" db:"ip_address"`
	UserAgent string                 `json:"user_agent" db:"user_agent"`
	CreatedAt time.Time              `json:"created_at" db:"created_at"`
}

type AuditLogger struct {
	db *PostgresDB
}

func NewAuditLogger(db *PostgresDB) *AuditLogger {
	return &AuditLogger{db: db}
}

func (l *AuditLogger) Log(ctx context.Context, userID, username, action, resource, resourceID, ipAddress, userAgent string, details map[string]interface{}) error {
	detailsJSON, _ := json.Marshal(details)

	query := `
		INSERT INTO audit_logs (id, user_id, username, action, resource, resource_id, details, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := l.db.ExecContext(ctx, query,
		uuid.New().String(),
		userID,
		username,
		action,
		resource,
		resourceID,
		string(detailsJSON),
		ipAddress,
		userAgent,
		time.Now(),
	)

	return err
}

func (l *AuditLogger) LogLogin(ctx context.Context, userID, username, ipAddress, userAgent string, success bool) error {
	action := "LOGIN"
	if !success {
		action = "LOGIN_FAILED"
	}

	return l.Log(ctx, userID, username, action, "auth", "", ipAddress, userAgent, map[string]interface{}{
		"success": success,
	})
}

func (l *AuditLogger) LogUserAction(ctx context.Context, actorID, actorName, action, targetUserID, ipAddress, userAgent string) error {
	return l.Log(ctx, actorID, actorName, action, "user", targetUserID, ipAddress, userAgent, nil)
}

func (l *AuditLogger) LogExport(ctx context.Context, userID, username, format string, recordCount int, ipAddress, userAgent string) error {
	return l.Log(ctx, userID, username, "EXPORT", "data", "", ipAddress, userAgent, map[string]interface{}{
		"format":      format,
		"record_count": recordCount,
	})
}

func (l *AuditLogger) GetLogs(ctx context.Context, page, limit int, userID, action, from, to string) ([]AuditLog, int, error) {
	query := `
		SELECT id, user_id, username, action, resource, resource_id, details::text, ip_address, user_agent, created_at
		FROM audit_logs WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM audit_logs WHERE 1=1`
	args := []interface{}{}
	argCount := 1

	if userID != "" {
		query += ` AND user_id = ` + "$" + string(rune('0'+argCount))
		countQuery += ` AND user_id = ` + "$" + string(rune('0'+argCount))
		args = append(args, userID)
		argCount++
	}

	if action != "" {
		query += ` AND action = ` + "$" + string(rune('0'+argCount))
		countQuery += ` AND action = ` + "$" + string(rune('0'+argCount))
		args = append(args, action)
		argCount++
	}

	if from != "" {
		query += ` AND created_at >= ` + "$" + string(rune('0'+argCount))
		countQuery += ` AND created_at >= ` + "$" + string(rune('0'+argCount))
		args = append(args, from)
		argCount++
	}

	if to != "" {
		query += ` AND created_at <= ` + "$" + string(rune('0'+argCount))
		countQuery += ` AND created_at <= ` + "$" + string(rune('0'+argCount))
		args = append(args, to)
		argCount++
	}

	var count int
	err := l.db.QueryRowContext(ctx, countQuery, args...).Scan(&count)
	if err != nil {
		return nil, 0, err
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune('0'+argCount)) + ` OFFSET $` + string(rune('0'+argCount+1))
	args = append(args, limit, (page-1)*limit)

	rows, err := l.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var log AuditLog
		var detailsJSON string

		err := rows.Scan(&log.ID, &log.UserID, &log.Username, &log.Action, &log.Resource,
			&log.ResourceID, &detailsJSON, &log.IPAddress, &log.UserAgent, &log.CreatedAt)
		if err != nil {
			return nil, 0, err
		}

		json.Unmarshal([]byte(detailsJSON), &log.Details)

		logs = append(logs, log)
	}

	return logs, count, nil
}
