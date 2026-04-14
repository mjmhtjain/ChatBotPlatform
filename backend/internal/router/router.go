package router

import (
	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/middleware"
)

func Setup(r *gin.Engine, authHandler *handlers.AuthHandler, projectHandler *handlers.ProjectHandler, flowHandler *handlers.FlowHandler, jwtSecret string) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		protected := api.Group("/")
		protected.Use(middleware.Auth(jwtSecret))
		{
			projects := protected.Group("/projects")
			{
				projects.GET("", projectHandler.List)
				projects.POST("", projectHandler.Create)
				projects.PATCH("/:id", projectHandler.Rename)
				projects.DELETE("/:id", projectHandler.Delete)

				flows := projects.Group("/:id/flows")
				{
					flows.GET("", flowHandler.List)
					flows.POST("", flowHandler.Create)
					flows.GET("/:flowId", flowHandler.Get)
					flows.PUT("/:flowId", flowHandler.Update)
					flows.DELETE("/:flowId", flowHandler.Delete)
				}
			}
		}
	}
}
