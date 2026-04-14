package models

import "time"

type Session struct {
	ID           string     `json:"id" db:"id"`
	UserID       string     `json:"user_id" db:"user_id"`
	RefreshToken string     `json:"-" db:"refresh_token"`
	UserAgent    string     `json:"user_agent" db:"user_agent"`
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	ExpiresAt    time.Time  `json:"expires_at" db:"expires_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	Revoked      bool       `json:"revoked" db:"revoked"`
	RevokedAt    *time.Time `json:"revoked_at,omitempty" db:"revoked_at"`
}
