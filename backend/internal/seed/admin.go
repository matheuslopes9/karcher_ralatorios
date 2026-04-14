package seed

import (
	"database/sql"
	"log"

	"karcher-analytics/internal/auth"
	"karcher-analytics/internal/models"

	"github.com/google/uuid"
)

func SeedMasterUser(db *sql.DB, username, password, email, name string) error {
	log.Println("Checking if master user exists...")

	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE username = $1`, username).Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("Master user already exists. Skipping seed.")
		return nil
	}

	log.Println("Creating master user (SUPER_ADMIN)...")

	passwordHash, err := auth.HashPassword(password, 12)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO users (id, name, email, username, password_hash, role, is_active, is_master)
		VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
	`

	_, err = db.Exec(query,
		uuid.New().String(),
		name,
		email,
		username,
		passwordHash,
		string(models.RoleSuperAdmin),
	)

	if err != nil {
		return err
	}

	log.Println("Master user created successfully!")
	return nil
}
