package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/config"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/middleware"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

func main() {
	cfg := config.Load()

	authSvc := services.NewAuthService(cfg.AdminEmail, cfg.AdminPassword, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authSvc)

	r := gin.Default()
	r.Use(middleware.CORS("http://localhost:3000"))

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}
	}

	log.Printf("Backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
