package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Typebot
	TypebotAPIURL          string
	TypebotAdminEmail      string
	TypebotAPIToken        string
	TypebotBotSlug         string
	TypebotCollectInterval time.Duration
	TypebotBatchLimit      int
	TypebotRetryMax        int
	TypebotRetryBackoff    time.Duration

	// Database
	DatabaseURL       string
	DatabaseMaxConns  int
	DatabaseIdleConns int

	// Redis
	RedisURL      string
	RedisPassword string

	// JWT
	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration
	BCryptCost       int

	// Master User
	MasterUsername string
	MasterPassword string
	MasterEmail    string
	MasterName     string

	// API
	APIPort              string
	APICORSOrigins       string
	RateLimitLoginMax    int
	RateLimitLoginWindow time.Duration
	RateLimitLoginBlock  time.Duration

	// Analysis
	AnalysisInterval      time.Duration
	SnapshotRetentionDays int

	// Export
	PDFCompanyName    string
	PDFCompanyLogoURL string
	ExportMaxRows     int
	ExportTempDir     string

	// Environment
	Environment string
	LogLevel    string
	Timezone    string
}

func Load() *Config {
	// Carrega .env se existir
	godotenv.Load()

	return &Config{
		// Typebot
		TypebotAPIURL:          getEnv("TYPEBOT_API_URL", "https://bot.uctechnology.com.br"),
		TypebotAdminEmail:      getEnv("TYPEBOT_ADMIN_EMAIL", ""),
		TypebotAPIToken:        getEnv("TYPEBOT_API_TOKEN", ""),
		TypebotBotSlug:         getEnv("TYPEBOT_BOT_SLUG", "cmnggz3f3000zbwtdo6tmpbl8"),
		TypebotCollectInterval: getDurationEnv("TYPEBOT_COLLECT_INTERVAL", 30*time.Second),
		TypebotBatchLimit:      getIntEnv("TYPEBOT_BATCH_LIMIT", 100),
		TypebotRetryMax:        getIntEnv("TYPEBOT_RETRY_MAX", 3),
		TypebotRetryBackoff:    getDurationEnv("TYPEBOT_RETRY_BACKOFF", 5*time.Second),

		// Database
		DatabaseURL:       getEnv("DATABASE_URL", "postgresql://karcher:karcher@localhost:5432/karcher_analytics"),
		DatabaseMaxConns:  getIntEnv("DATABASE_MAX_CONNECTIONS", 25),
		DatabaseIdleConns: getIntEnv("DATABASE_IDLE_CONNECTIONS", 5),

		// Redis
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		// JWT
		JWTSecret:        getEnv("JWT_SECRET", "change-me-to-random-string-min-64-chars"),
		JWTAccessExpiry:  getDurationEnv("JWT_ACCESS_EXPIRY", 15*time.Minute),
		JWTRefreshExpiry: getDurationEnv("JWT_REFRESH_EXPIRY", 168*time.Hour),
		BCryptCost:       getIntEnv("BCRYPT_COST", 12),

		// Master User
		MasterUsername: getEnv("MASTER_USERNAME", "admin"),
		MasterPassword: getEnv("MASTER_PASSWORD", "UCT3chn0l0gy!@"),
		MasterEmail:    getEnv("MASTER_EMAIL", "admin@uctechnology.com.br"),
		MasterName:     getEnv("MASTER_NAME", "UC Technology Admin"),

		// API
		APIPort:              getEnv("API_PORT", "8080"),
		APICORSOrigins:       getEnv("API_CORS_ORIGINS", "*"),
		RateLimitLoginMax:    getIntEnv("RATE_LIMIT_LOGIN_MAX", 5),
		RateLimitLoginWindow: getDurationEnv("RATE_LIMIT_LOGIN_WINDOW", 15*time.Minute),
		RateLimitLoginBlock:  getDurationEnv("RATE_LIMIT_LOGIN_BLOCK", 15*time.Minute),

		// Analysis
		AnalysisInterval:      getDurationEnv("ANALYSIS_INTERVAL", 5*time.Minute),
		SnapshotRetentionDays: getIntEnv("SNAPSHOT_RETENTION_DAYS", 365),

		// Export
		PDFCompanyName:    getEnv("PDF_COMPANY_NAME", "UC Technology / Kärcher"),
		PDFCompanyLogoURL: getEnv("PDF_COMPANY_LOGO_URL", ""),
		ExportMaxRows:     getIntEnv("EXPORT_MAX_ROWS", 50000),
		ExportTempDir:     getEnv("EXPORT_TEMP_DIR", "/tmp/exports"),

		// Environment
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "debug"),
		Timezone:    getEnv("TZ", "America/Sao_Paulo"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getIntEnv(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		var intVal int
		_, err := fmt.Sscanf(value, "%d", &intVal)
		if err == nil {
			return intVal
		}
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}
