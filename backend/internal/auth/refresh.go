package auth

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type RefreshTokenStore struct {
	DB *sql.DB
}

func (s *RefreshTokenStore) CreateSession(ctx context.Context, userID, refreshToken, userAgent, ipAddress string, expiresAt time.Time) error {
	query := `
		INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := s.DB.ExecContext(ctx, query, uuid.New().String(), userID, refreshToken, userAgent, ipAddress, expiresAt)
	return err
}

func (s *RefreshTokenStore) GetSession(ctx context.Context, refreshToken string) (userID string, expiresAt time.Time, revoked bool, err error) {
	query := `SELECT user_id, expires_at, revoked FROM sessions WHERE refresh_token = $1`
	err = s.DB.QueryRowContext(ctx, query, refreshToken).Scan(&userID, &expiresAt, &revoked)
	return
}

func (s *RefreshTokenStore) RevokeSession(ctx context.Context, refreshToken string) error {
	query := `UPDATE sessions SET revoked = TRUE, revoked_at = NOW() WHERE refresh_token = $1`
	result, err := s.DB.ExecContext(ctx, query, refreshToken)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("sessão não encontrada")
	}

	return nil
}

func (s *RefreshTokenStore) RevokeAllUserSessions(ctx context.Context, userID string) error {
	query := `UPDATE sessions SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1 AND revoked = FALSE`
	_, err := s.DB.ExecContext(ctx, query, userID)
	return err
}

func (s *RefreshTokenStore) GetUserSessions(ctx context.Context, userID string) ([]map[string]interface{}, error) {
	query := `
		SELECT id, user_agent, ip_address, created_at, expires_at, revoked
		FROM sessions 
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY created_at DESC
	`
	rows, err := s.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []map[string]interface{}
	for rows.Next() {
		session := make(map[string]interface{})
		var id string
		var userAgent, ipAddress string
		var createdAt, expiresAt time.Time
		var revoked bool

		err := rows.Scan(&id, &userAgent, &ipAddress, &createdAt, &expiresAt, &revoked)
		if err != nil {
			return nil, err
		}

		session["id"] = id
		session["user_agent"] = userAgent
		session["ip_address"] = ipAddress
		session["created_at"] = createdAt
		session["expires_at"] = expiresAt
		session["revoked"] = revoked

		sessions = append(sessions, session)
	}

	return sessions, nil
}
