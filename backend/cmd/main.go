package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/config"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/database"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/middleware"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/router"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}

	authSvc := services.NewAuthService(cfg.AdminEmail, cfg.AdminPassword, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authSvc)

	projectSvc := services.NewProjectService(db)
	projectHandler := handlers.NewProjectHandler(projectSvc)

	flowSvc := services.NewFlowService(db)
	flowHandler := handlers.NewFlowHandler(flowSvc)

	r := gin.Default()
	r.Use(middleware.CORS(cfg.CORSOrigin))

	router.Setup(r, authHandler, projectHandler, flowHandler, cfg.JWTSecret)

	log.Printf("Backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
