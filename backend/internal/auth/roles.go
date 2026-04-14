package auth

import (
	"github.com/gofiber/fiber/v2"
)

// Roles do usuário para verificação
type UserRole string

const (
	RoleSuperAdmin UserRole = "SUPER_ADMIN"
	RoleAdmin      UserRole = "ADMIN"
	RoleAnalyst    UserRole = "ANALYST"
	RoleViewer     UserRole = "VIEWER"
)

func RequireRole(allowedRoles ...UserRole) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := GetRole(c)

		for _, role := range allowedRoles {
			if userRole == string(role) {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "acesso negado - nível de permissão insuficiente",
		})
	}
}

func IsSuperAdmin(c *fiber.Ctx) bool {
	return GetRole(c) == string(RoleSuperAdmin)
}

func IsAdmin(c *fiber.Ctx) bool {
	role := GetRole(c)
	return role == string(RoleSuperAdmin) || role == string(RoleAdmin)
}

func CanExport(c *fiber.Ctx) bool {
	role := GetRole(c)
	return role == string(RoleSuperAdmin) ||
		role == string(RoleAdmin) ||
		role == string(RoleAnalyst)
}
