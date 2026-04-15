package models

import "time"

type UserRole string

const (
	RoleSuperAdmin UserRole = "SUPER_ADMIN"
	RoleAdmin      UserRole = "ADMIN"
	RoleAnalyst    UserRole = "ANALYST"
	RoleViewer     UserRole = "VIEWER"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Email        string    `json:"email" db:"email"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         UserRole  `json:"role" db:"role"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	IsMaster     bool      `json:"is_master" db:"is_master"`
	AvatarURL    string       `json:"avatar_url,omitempty" db:"avatar_url"`
	LastLogin    *time.Time   `json:"last_login,omitempty" db:"last_login"`
	CreatedAt    time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at" db:"updated_at"`
	CreatedBy    string       `json:"created_by,omitempty" db:"created_by"`
}

type CreateUserInput struct {
	Name     string   `json:"name"`
	Email    string   `json:"email"`
	Username string   `json:"username"`
	Password string   `json:"password"`
	Role     UserRole `json:"role"`
}

type UpdateUserInput struct {
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      UserRole  `json:"role"`
	IsActive  *bool     `json:"is_active"`
	AvatarURL string    `json:"avatar_url"`
}

type ResetPasswordInput struct {
	NewPassword string `json:"new_password"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}
