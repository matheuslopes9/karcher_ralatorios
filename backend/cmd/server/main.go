package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"karcher-analytics/internal/auth"
	"karcher-analytics/internal/collector"
	"karcher-analytics/internal/config"
	"karcher-analytics/internal/models"
	"karcher-analytics/internal/results"
	"karcher-analytics/internal/seed"
	"karcher-analytics/internal/storage"
	"karcher-analytics/internal/users"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Carrega configurações
	cfg := config.Load()

	log.Printf("Starting Kärcher Analytics Platform - Environment: %s", cfg.Environment)

	// Conecta ao PostgreSQL
	pgDB, err := storage.NewPostgresDB(cfg.DatabaseURL, cfg.DatabaseMaxConns, cfg.DatabaseIdleConns)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pgDB.Close()

	// Executa migrations
	migrationsDir := filepath.Join("migrations")
	if err := pgDB.RunMigrations(migrationsDir); err != nil {
		log.Printf("Warning: Migration error (may be already applied): %v", err)
	}

	// Seed do usuário master
	if err := seed.SeedMasterUser(pgDB.DB, cfg.MasterUsername, cfg.MasterPassword, cfg.MasterEmail, cfg.MasterName); err != nil {
		log.Printf("Warning: Failed to seed master user (may already exist): %v", err)
	}

	// Inicializa serviços
	tokenService := auth.NewTokenService(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	refreshStore := &auth.RefreshTokenStore{DB: pgDB.DB}
	userRepo := users.NewRepository(pgDB.DB)
	resultsRepo := results.NewRepository(pgDB.DB)
	typebotCollector := collector.NewClient(pgDB.DB, cfg.TypebotAPIURL, cfg.TypebotAPIToken, cfg.TypebotBotSlug)

	// Inicia coleta periódica do Typebot em background
	collectorCtx, collectorCancel := context.WithCancel(context.Background())
	defer collectorCancel()
	go typebotCollector.StartScheduler(collectorCtx, cfg.TypebotCollectInterval)

	// Cria Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024, // 10MB
	})

	// Middleware globais
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.APICORSOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Rota de diagnóstico temporária (remover após confirmar login)
	app.Get("/debug/auth", func(c *fiber.Ctx) error {
		// Lê hash atual do banco
		var dbHash string
		var isActive bool
		var role string
		err := pgDB.DB.QueryRowContext(c.Context(),
			`SELECT password_hash, is_active, role FROM users WHERE username = $1`,
			cfg.MasterUsername,
		).Scan(&dbHash, &isActive, &role)

		var dbFound bool
		var hashMatch bool
		var dbHashPreview string
		if err == nil {
			dbFound = true
			hashMatch = auth.CheckPasswordHash(cfg.MasterPassword, dbHash)
			if len(dbHash) > 10 {
				dbHashPreview = dbHash[:10] + "..."
			}
		}

		return c.JSON(fiber.Map{
			"master_username":  cfg.MasterUsername,
			"password_len":     len(cfg.MasterPassword),
			"password_last2":   cfg.MasterPassword[max(0, len(cfg.MasterPassword)-2):],
			"db_user_found":    dbFound,
			"db_user_active":   isActive,
			"db_user_role":     role,
			"db_hash_preview":  dbHashPreview,
			"db_hash_match":    hashMatch,
			"db_error":         fmt.Sprintf("%v", err),
		})
	})

	// Debug: lista typebots disponíveis para descobrir o ID correto
	app.Get("/debug/typebots", func(c *fiber.Ctx) error {
		body, err := typebotCollector.ListTypebots(c.Context())
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		c.Set("Content-Type", "application/json")
		return c.SendString(body)
	})

	// Rota de reset forçado do master (debug — remover após login funcionar)
	app.Get("/debug/reset-master", func(c *fiber.Ctx) error {
		newHash, err := auth.HashPassword(cfg.MasterPassword, 12)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		res, err := pgDB.DB.ExecContext(c.Context(), `
			UPDATE users SET password_hash = $1, is_active = TRUE, role = 'SUPER_ADMIN'
			WHERE username = $2
		`, newHash, cfg.MasterUsername)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		rows, _ := res.RowsAffected()

		// Se não existe, cria
		if rows == 0 {
			_, err = pgDB.DB.ExecContext(c.Context(), `
				INSERT INTO users (id, name, email, username, password_hash, role, is_active, is_master)
				VALUES (gen_random_uuid(), $1, $2, $3, $4, 'SUPER_ADMIN', TRUE, TRUE)
			`, cfg.MasterName, cfg.MasterEmail, cfg.MasterUsername, newHash)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "insert failed: " + err.Error()})
			}
			return c.JSON(fiber.Map{"status": "created", "username": cfg.MasterUsername})
		}

		return c.JSON(fiber.Map{"status": "password_reset_ok", "username": cfg.MasterUsername, "rows_affected": rows})
	})

	// Rota de health check (pública)
	app.Get("/health", func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := pgDB.HealthCheck(ctx); err != nil {
			return c.Status(http.StatusServiceUnavailable).JSON(fiber.Map{
				"status":  "unhealthy",
				"message": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// ═══════════════════════════════════════════
	// ROTAS PÚBLICAS (apenas login e refresh)
	// ═══════════════════════════════════════════
	api := app.Group("/api")

	// POST /api/auth/login
	api.Post("/auth/login", func(c *fiber.Ctx) error {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "corpo da requisição inválido",
			})
		}

		if req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "username e password são obrigatórios",
			})
		}

		// Busca usuário
		user, err := userRepo.GetUserByUsername(c.Context(), req.Username)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "credenciais inválidas",
			})
		}

		// Verifica se está ativo
		if !user.IsActive {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "usuário desativado",
			})
		}

		// Verifica senha
		if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "credenciais inválidas",
			})
		}

		// Gera tokens
		tokenPair, err := tokenService.GenerateTokenPair(user.ID, user.Username, string(user.Role))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao gerar tokens",
			})
		}

		// Salva sessão
		userAgent := string(c.Request().Header.UserAgent())
		ipAddress := c.IP()
		expiresAt := time.Now().Add(cfg.JWTRefreshExpiry)

		if err := refreshStore.CreateSession(c.Context(), user.ID, tokenPair.RefreshToken, userAgent, ipAddress, expiresAt); err != nil {
			log.Printf("Failed to create session: %v", err)
		}

		// Atualiza último login
		userRepo.UpdateLastLogin(c.Context(), user.ID)

		return c.JSON(fiber.Map{
			"access_token":  tokenPair.AccessToken,
			"refresh_token": tokenPair.RefreshToken,
			"expires_in":    tokenPair.ExpiresIn,
			"user": fiber.Map{
				"id":       user.ID,
				"name":     user.Name,
				"username": user.Username,
				"email":    user.Email,
				"role":     user.Role,
				"is_master": user.IsMaster,
			},
		})
	})

	// POST /api/auth/refresh
	api.Post("/auth/refresh", func(c *fiber.Ctx) error {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "refresh_token é obrigatório",
			})
		}

		// Valida sessão no banco
		userID, expiresAt, revoked, err := refreshStore.GetSession(c.Context(), req.RefreshToken)
		if err != nil || revoked {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "refresh token inválido ou revogado",
			})
		}

		// Verifica expiração
		if time.Now().After(expiresAt) {
			refreshStore.RevokeSession(c.Context(), req.RefreshToken)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "refresh token expirado",
			})
		}

		// Busca dados do usuário
		user, err := userRepo.GetUserByID(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		// Gera novos tokens (rotação)
		tokenPair, err := tokenService.GenerateTokenPair(user.ID, user.Username, string(user.Role))
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao gerar tokens",
			})
		}

		// Revoga token antigo e cria novo
		refreshStore.RevokeSession(c.Context(), req.RefreshToken)
		expiresAt = time.Now().Add(cfg.JWTRefreshExpiry)
		refreshStore.CreateSession(c.Context(), user.ID, tokenPair.RefreshToken, "", c.IP(), expiresAt)

		return c.JSON(fiber.Map{
			"access_token":  tokenPair.AccessToken,
			"refresh_token": tokenPair.RefreshToken,
			"expires_in":    tokenPair.ExpiresIn,
		})
	})

	// ═══════════════════════════════════════════
	// ROTAS PROTEGIDAS (requer autenticação)
	// ═══════════════════════════════════════════
	protected := api.Group("/", auth.AuthMiddleware(tokenService))

	// GET /api/auth/me
	protected.Get("/auth/me", func(c *fiber.Ctx) error {
		userID := auth.GetUserID(c)
		user, err := userRepo.GetUserByID(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		return c.JSON(fiber.Map{
			"id":        user.ID,
			"name":      user.Name,
			"username":  user.Username,
			"email":     user.Email,
			"role":      user.Role,
			"is_active": user.IsActive,
			"is_master": user.IsMaster,
			"avatar_url": user.AvatarURL,
			"last_login": user.LastLogin,
		})
	})

	// POST /api/auth/logout
	protected.Post("/auth/logout", func(c *fiber.Ctx) error {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}

		if err := c.BodyParser(&req); err == nil && req.RefreshToken != "" {
			refreshStore.RevokeSession(c.Context(), req.RefreshToken)
		}

		return c.JSON(fiber.Map{
			"message": "logout realizado com sucesso",
		})
	})

	// GET /api/auth/sessions
	protected.Get("/auth/sessions", func(c *fiber.Ctx) error {
		userID := auth.GetUserID(c)
		sessions, err := refreshStore.GetUserSessions(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao listar sessões",
			})
		}

		return c.JSON(sessions)
	})

	// DELETE /api/auth/sessions/:sessionId
	protected.Delete("/auth/sessions/:sessionId", func(c *fiber.Ctx) error {
		sessionID := c.Params("sessionId")
		// Implementar revogação de sessão específica
		log.Printf("Revogando sessão: %s", sessionID)

		return c.JSON(fiber.Map{
			"message": "sessão revogada com sucesso",
		})
	})

	// PUT /api/auth/me/password
	protected.Put("/auth/me/password", func(c *fiber.Ctx) error {
		var req models.ChangePasswordInput

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "corpo da requisição inválido",
			})
		}

		userID := auth.GetUserID(c)
		user, err := userRepo.GetUserByID(c.Context(), userID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		// Verifica senha atual
		if !auth.CheckPasswordHash(req.CurrentPassword, user.PasswordHash) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "senha atual incorreta",
			})
		}

		// Valida nova senha
		if err := auth.ValidatePasswordStrength(req.NewPassword); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// Hash e salva nova senha
		passwordHash, err := auth.HashPassword(req.NewPassword, cfg.BCryptCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao processar senha",
			})
		}

		if err := userRepo.ChangePassword(c.Context(), userID, passwordHash); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao alterar senha",
			})
		}

		return c.JSON(fiber.Map{
			"message": "senha alterada com sucesso",
		})
	})

	// ═══════════════════════════════════════════
	// USERS (apenas SUPER_ADMIN e ADMIN)
	// ═══════════════════════════════════════════
	usersGroup := protected.Group("/users", auth.RequireRole(
		auth.RoleSuperAdmin,
		auth.RoleAdmin,
	))

	// GET /api/users
	usersGroup.Get("/", func(c *fiber.Ctx) error {
		page := c.QueryInt("page", 1)
		limit := c.QueryInt("limit", 20)
		search := c.Query("search")
		roleStr := c.Query("role")
		activeStr := c.Query("active")

		var role models.UserRole
		if roleStr != "" {
			role = models.UserRole(roleStr)
		}

		var active *bool
		if activeStr != "" {
			val := activeStr == "true"
			active = &val
		}

		usersList, total, err := userRepo.ListUsers(c.Context(), page, limit, search, role, active)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao listar usuários",
			})
		}

		return c.JSON(fiber.Map{
			"data":  usersList,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	})

	// GET /api/users/:id
	usersGroup.Get("/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		user, err := userRepo.GetUserByID(c.Context(), id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		return c.JSON(user)
	})

	// POST /api/users
	usersGroup.Post("/", func(c *fiber.Ctx) error {
		var req models.CreateUserInput

		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "corpo da requisição inválido",
			})
		}

		// Validações
		if req.Name == "" || req.Email == "" || req.Username == "" || req.Password == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "todos os campos são obrigatórios",
			})
		}

		// Valida força da senha
		if err := auth.ValidatePasswordStrength(req.Password); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// ADMIN não pode criar SUPER_ADMIN
		currentRole := auth.GetRole(c)
		if currentRole == string(auth.RoleAdmin) && req.Role == models.RoleSuperAdmin {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "apenas SUPER_ADMIN pode criar outro SUPER_ADMIN",
			})
		}

		createdBy := auth.GetUserID(c)
		user, err := userRepo.CreateUser(c.Context(), req, createdBy)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao criar usuário",
			})
		}

		return c.Status(fiber.StatusCreated).JSON(user)
	})

	// PUT /api/users/:id
	usersGroup.Put("/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		// Verifica se é usuário master
		user, err := userRepo.GetUserByID(c.Context(), id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		if user.IsMaster {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "usuário master não pode ser modificado",
			})
		}

		var req models.UpdateUserInput
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "corpo da requisição inválido",
			})
		}

		updatedUser, err := userRepo.UpdateUser(c.Context(), id, req)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao atualizar usuário",
			})
		}

		return c.JSON(updatedUser)
	})

	// DELETE /api/users/:id (apenas SUPER_ADMIN)
	usersGroup.Delete("/:id", auth.RequireRole(auth.RoleSuperAdmin), func(c *fiber.Ctx) error {
		id := c.Params("id")

		user, err := userRepo.GetUserByID(c.Context(), id)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "usuário não encontrado",
			})
		}

		if user.IsMaster {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "usuário master não pode ser deletado",
			})
		}

		if err := userRepo.DeleteUser(c.Context(), id); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "falha ao deletar usuário",
			})
		}

		return c.JSON(fiber.Map{
			"message": "usuário deletado com sucesso",
		})
	})

	// ═══════════════════════════════════════════
	// PLACEHOLDER ROUTES (Dashboard, Results, etc)
	// ═══════════════════════════════════════════

	// Dashboard
	protected.Get("/dashboard/overview", func(c *fiber.Ctx) error {
		stats, err := resultsRepo.GetOverview(c.Context())
		if err != nil {
			log.Printf("dashboard/overview error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "falha ao carregar overview"})
		}
		return c.JSON(stats)
	})

	// Results
	protected.Get("/results", func(c *fiber.Ctx) error {
		page := c.QueryInt("page", 1)
		limit := c.QueryInt("limit", 50)

		var onlyCompleted *bool
		if s := c.Query("completed"); s != "" {
			v := s == "true"
			onlyCompleted = &v
		}

		data, total, err := resultsRepo.ListResults(c.Context(), page, limit, onlyCompleted)
		if err != nil {
			log.Printf("results error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "falha ao listar resultados"})
		}
		if data == nil {
			data = []results.ResultRow{}
		}
		return c.JSON(fiber.Map{"data": data, "total": total, "page": page, "limit": limit})
	})

	// Analytics
	protected.Get("/analytics/summary", func(c *fiber.Ctx) error {
		period := c.Query("period", "daily")
		summary, err := resultsRepo.GetAnalyticsSummary(c.Context(), period)
		if err != nil {
			log.Printf("analytics/summary error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "falha ao carregar analytics"})
		}
		return c.JSON(summary)
	})

	// Reports
	protected.Get("/reports", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"data": []interface{}{},
		})
	})

	// Export
	protected.Post("/export", auth.RequireRole(
		auth.RoleSuperAdmin,
		auth.RoleAdmin,
		auth.RoleAnalyst,
	), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "exportação em breve",
		})
	})

	// Audit logs (apenas SUPER_ADMIN)
	protected.Get("/audit-logs", auth.RequireRole(auth.RoleSuperAdmin), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"data":  []interface{}{},
			"total": 0,
		})
	})

	// ═══════════════════════════════════════════
	// INICIA SERVIDOR
	// ═══════════════════════════════════════════

	addr := fmt.Sprintf(":%s", cfg.APIPort)

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutting down server...")
		os.Exit(0)
	}()

	log.Printf("Server starting on %s", addr)
	log.Printf("API Documentation: http://localhost%s/health", cfg.APIPort)

	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
