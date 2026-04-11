package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

// ProjectServicer is defined here (consumer-side interface — idiomatic Go).
// *services.ProjectService satisfies it via structural typing.
type ProjectServicer interface {
	Create(ownerEmail, name string) (*models.Project, error)
	List(ownerEmail string) ([]models.Project, error)
	Rename(ownerEmail, id, name string) (*models.Project, error)
	Delete(ownerEmail, id string) error
}

type ProjectHandler struct {
	svc ProjectServicer
}

func NewProjectHandler(svc ProjectServicer) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

type projectNameRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *ProjectHandler) List(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projects, err := h.svc.List(ownerEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch projects"})
		return
	}
	c.JSON(http.StatusOK, projects)
}

func (h *ProjectHandler) Create(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	var req projectNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	p, err := h.svc.Create(ownerEmail, req.Name)
	if err != nil {
		if errors.Is(err, services.ErrDuplicateName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a project with that name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create project"})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *ProjectHandler) Rename(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	id := c.Param("id")
	var req projectNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	p, err := h.svc.Rename(ownerEmail, id, req.Name)
	if err != nil {
		if errors.Is(err, services.ErrDuplicateName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a project with that name already exists"})
			return
		}
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not rename project"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProjectHandler) Delete(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	id := c.Param("id")
	err := h.svc.Delete(ownerEmail, id)
	if err != nil {
		if errors.Is(err, services.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete project"})
		return
	}
	c.Status(http.StatusNoContent)
}
