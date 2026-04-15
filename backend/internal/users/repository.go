package users

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"karcher-analytics/internal/auth"
	"karcher-analytics/internal/models"

	"github.com/google/uuid"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, input models.CreateUserInput, createdBy string) (*models.User, error) {
	passwordHash, err := auth.HashPassword(input.Password, 12)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		ID:           uuid.New().String(),
		Name:         input.Name,
		Email:        input.Email,
		Username:     input.Username,
		PasswordHash: passwordHash,
		Role:         input.Role,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		CreatedBy:    createdBy,
	}

	query := `
		INSERT INTO users (id, name, email, username, password_hash, role, is_active, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, name, email, username, role, is_active, is_master, created_at, updated_at
	`

	err = r.db.QueryRowContext(ctx, query,
		user.ID, user.Name, user.Email, user.Username, user.PasswordHash,
		user.Role, user.IsActive, user.CreatedAt, user.UpdatedAt, user.CreatedBy,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Username, &user.Role,
		&user.IsActive, &user.IsMaster, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, name, email, username, password_hash, role, is_active, is_master,
			   COALESCE(avatar_url, ''), last_login, created_at, updated_at,
			   COALESCE(created_by::text, '')
		FROM users WHERE id = $1
	`

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.Username, &user.PasswordHash,
		&user.Role, &user.IsActive, &user.IsMaster, &user.AvatarURL,
		&user.LastLogin, &user.CreatedAt, &user.UpdatedAt, &user.CreatedBy,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	return user, err
}

func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT id, name, email, username, password_hash, role, is_active, is_master,
			   COALESCE(avatar_url, ''), last_login, created_at, updated_at,
			   COALESCE(created_by::text, '')
		FROM users WHERE username = $1
	`

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID, &user.Name, &user.Email, &user.Username, &user.PasswordHash,
		&user.Role, &user.IsActive, &user.IsMaster, &user.AvatarURL,
		&user.LastLogin, &user.CreatedAt, &user.UpdatedAt, &user.CreatedBy,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}

	return user, err
}

func (r *Repository) ListUsers(ctx context.Context, page, limit int, search string, role models.UserRole, active *bool) ([]models.User, int, error) {
	query := `
		SELECT id, name, email, username, role, is_active, is_master,
			   COALESCE(avatar_url, ''), COALESCE(last_login, '0001-01-01'), created_at, updated_at
		FROM users WHERE is_master = FALSE
	`
	countQuery := `SELECT COUNT(*) FROM users WHERE is_master = FALSE`
	args := []interface{}{}
	argCount := 1

	if search != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR email ILIKE $%d OR username ILIKE $%d)", argCount, argCount, argCount)
		countQuery += fmt.Sprintf(" AND (name ILIKE $%d OR email ILIKE $%d OR username ILIKE $%d)", argCount, argCount, argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	if role != "" {
		query += fmt.Sprintf(" AND role = $%d", argCount)
		countQuery += fmt.Sprintf(" AND role = $%d", argCount)
		args = append(args, string(role))
		argCount++
	}

	if active != nil {
		query += fmt.Sprintf(" AND is_active = $%d", argCount)
		countQuery += fmt.Sprintf(" AND is_active = $%d", argCount)
		args = append(args, *active)
		argCount++
	}

	var count int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&count)
	if err != nil {
		return nil, 0, err
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, (page-1)*limit)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.Name, &user.Email, &user.Username, &user.Role,
			&user.IsActive, &user.IsMaster, &user.AvatarURL, &user.LastLogin,
			&user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, count, nil
}

func (r *Repository) UpdateUser(ctx context.Context, id string, input models.UpdateUserInput) (*models.User, error) {
	setClauses := []string{"updated_at = NOW()"}
	args := []interface{}{}
	argIdx := 1

	if input.Name != "" {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, input.Name)
		argIdx++
	}
	if input.Email != "" {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, input.Email)
		argIdx++
	}
	if input.Role != "" {
		setClauses = append(setClauses, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, string(input.Role))
		argIdx++
	}
	if input.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *input.IsActive)
		argIdx++
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE users SET %s
		WHERE id = $%d
		RETURNING id, name, email, username, role, is_active, is_master, created_at, updated_at`,
		joinClauses(setClauses), argIdx,
	)

	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&user.ID, &user.Name, &user.Email, &user.Username, &user.Role,
		&user.IsActive, &user.IsMaster, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

func joinClauses(clauses []string) string {
	result := ""
	for i, c := range clauses {
		if i > 0 {
			result += ", "
		}
		result += c
	}
	return result
}

func (r *Repository) ChangePassword(ctx context.Context, id, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.db.ExecContext(ctx, query, passwordHash, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *Repository) DeleteUser(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE id = $1 AND is_master = FALSE`, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found or is master user")
	}

	return nil
}

func (r *Repository) UpdateLastLogin(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE users SET last_login = NOW() WHERE id = $1`, id)
	return err
}
