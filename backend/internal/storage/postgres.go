package storage

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type PostgresDB struct {
	*sql.DB
}

func NewPostgresDB(databaseURL string, maxConns, idleConns int) (*PostgresDB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(maxConns)
	db.SetMaxIdleConns(idleConns)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &PostgresDB{db}, nil
}

func (db *PostgresDB) RunMigrations(migrationsDir string) error {
	log.Println("Running database migrations...")

	// Cria tabela de controle de migrations se não existir
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename   VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	sort.Strings(files)

	for _, file := range files {
		filename := filepath.Base(file)

		// Verifica se já foi aplicada
		var count int
		db.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE filename = $1`, filename).Scan(&count)
		if count > 0 {
			log.Printf("Migration already applied, skipping: %s", filename)
			continue
		}

		log.Printf("Applying migration: %s", filename)

		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		queries := strings.Split(string(content), ";")
		for _, query := range queries {
			query = strings.TrimSpace(query)
			if query == "" {
				continue
			}
			if _, err := db.Exec(query); err != nil {
				return fmt.Errorf("failed to execute migration %s: %w", filename, err)
			}
		}

		// Registra como aplicada
		if _, err := db.Exec(`INSERT INTO schema_migrations (filename) VALUES ($1)`, filename); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		log.Printf("Migration applied: %s", filename)
	}

	log.Println("All migrations applied successfully")
	return nil
}

func (db *PostgresDB) Close() {
	if db.DB != nil {
		db.DB.Close()
	}
}

func (db *PostgresDB) HealthCheck(ctx context.Context) error {
	return db.PingContext(ctx)
}
