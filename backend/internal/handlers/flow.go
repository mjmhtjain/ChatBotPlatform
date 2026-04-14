package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

type FlowServicer interface {
	List(ownerEmail, projectID string) ([]models.Flow, error)
	Create(ownerEmail, projectID, name string) (*models.Flow, error)
	Get(ownerEmail, projectID, flowID string) (*models.Flow, error)
	Update(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error)
	Delete(ownerEmail, projectID, flowID string) error
}

type FlowHandler struct {
	svc FlowServicer
}

func NewFlowHandler(svc FlowServicer) *FlowHandler {
	return &FlowHandler{svc: svc}
}

type createFlowRequest struct {
	Name string `json:"name" binding:"required"`
}

type updateFlowRequest struct {
	Name string          `json:"name" binding:"required"`
	Data json.RawMessage `json:"data"`
}

func (h *FlowHandler) List(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projectID := c.Param("id")
	flows, err := h.svc.List(ownerEmail, projectID)
	if err != nil {
		if errors.Is(err, services.ErrFlowNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch flows"})
		return
	}
	c.JSON(http.StatusOK, flows)
}

func (h *FlowHandler) Create(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projectID := c.Param("id")
	var req createFlowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	f, err := h.svc.Create(ownerEmail, projectID, req.Name)
	if err != nil {
		if errors.Is(err, services.ErrFlowDuplicateName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a flow with that name already exists"})
			return
		}
		if errors.Is(err, services.ErrFlowNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create flow"})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func (h *FlowHandler) Get(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projectID := c.Param("id")
	flowID := c.Param("flowId")
	f, err := h.svc.Get(ownerEmail, projectID, flowID)
	if err != nil {
		if errors.Is(err, services.ErrFlowNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "flow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch flow"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FlowHandler) Update(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projectID := c.Param("id")
	flowID := c.Param("flowId")
	var req updateFlowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	f, err := h.svc.Update(ownerEmail, projectID, flowID, req.Name, models.RawJSON(req.Data))
	if err != nil {
		if errors.Is(err, services.ErrFlowNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "flow not found"})
			return
		}
		if errors.Is(err, services.ErrFlowDuplicateName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a flow with that name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update flow"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FlowHandler) Delete(c *gin.Context) {
	ownerEmail := c.GetString("owner_email")
	projectID := c.Param("id")
	flowID := c.Param("flowId")
	err := h.svc.Delete(ownerEmail, projectID, flowID)
	if err != nil {
		if errors.Is(err, services.ErrFlowNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "flow not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete flow"})
		return
	}
	c.Status(http.StatusNoContent)
}
