package router

import (
	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
)

func Setup(r *gin.Engine, authHandler *handlers.AuthHandler) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}
	}
}
