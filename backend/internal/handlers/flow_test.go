package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

type mockFlowService struct {
	listFn   func(ownerEmail, projectID string) ([]models.Flow, error)
	createFn func(ownerEmail, projectID, name string) (*models.Flow, error)
	getFn    func(ownerEmail, projectID, flowID string) (*models.Flow, error)
	updateFn func(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error)
	deleteFn func(ownerEmail, projectID, flowID string) error
}

func (m *mockFlowService) List(ownerEmail, projectID string) ([]models.Flow, error) {
	return m.listFn(ownerEmail, projectID)
}
func (m *mockFlowService) Create(ownerEmail, projectID, name string) (*models.Flow, error) {
	return m.createFn(ownerEmail, projectID, name)
}
func (m *mockFlowService) Get(ownerEmail, projectID, flowID string) (*models.Flow, error) {
	return m.getFn(ownerEmail, projectID, flowID)
}
func (m *mockFlowService) Update(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error) {
	return m.updateFn(ownerEmail, projectID, flowID, name, data)
}
func (m *mockFlowService) Delete(ownerEmail, projectID, flowID string) error {
	return m.deleteFn(ownerEmail, projectID, flowID)
}

func newFlowTestRouter(svc FlowServicer) *gin.Engine {
	h := NewFlowHandler(svc)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("owner_email", "admin@example.com")
		c.Next()
	})
	r.GET("/api/projects/:projectId/flows", h.List)
	r.POST("/api/projects/:projectId/flows", h.Create)
	r.GET("/api/projects/:projectId/flows/:flowId", h.Get)
	r.PUT("/api/projects/:projectId/flows/:flowId", h.Update)
	r.DELETE("/api/projects/:projectId/flows/:flowId", h.Delete)
	return r
}

func TestFlowList_Success(t *testing.T) {
	svc := &mockFlowService{
		listFn: func(ownerEmail, projectID string) ([]models.Flow, error) {
			return []models.Flow{{ID: "f1", ProjectID: projectID, Name: "Welcome Flow"}}, nil
		},
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodGet, "/api/projects/proj-1/flows", nil)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var flows []models.Flow
	json.Unmarshal(w.Body.Bytes(), &flows)
	if len(flows) != 1 || flows[0].Name != "Welcome Flow" {
		t.Errorf("unexpected flows: %+v", flows)
	}
}

func TestFlowCreate_Success(t *testing.T) {
	svc := &mockFlowService{
		createFn: func(ownerEmail, projectID, name string) (*models.Flow, error) {
			return &models.Flow{ID: "new-f", ProjectID: projectID, Name: name}, nil
		},
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects/proj-1/flows", map[string]string{"name": "My Flow"})

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var f models.Flow
	json.Unmarshal(w.Body.Bytes(), &f)
	if f.Name != "My Flow" {
		t.Errorf("expected name=My Flow, got %s", f.Name)
	}
}

func TestFlowCreate_MissingName(t *testing.T) {
	svc := &mockFlowService{
		createFn: func(ownerEmail, projectID, name string) (*models.Flow, error) { return nil, nil },
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects/proj-1/flows", map[string]string{})

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestFlowCreate_DuplicateName(t *testing.T) {
	svc := &mockFlowService{
		createFn: func(ownerEmail, projectID, name string) (*models.Flow, error) {
			return nil, services.ErrFlowDuplicateName
		},
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects/proj-1/flows", map[string]string{"name": "Dup"})

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

func TestFlowGet_Success(t *testing.T) {
	svc := &mockFlowService{
		getFn: func(ownerEmail, projectID, flowID string) (*models.Flow, error) {
			return &models.Flow{ID: flowID, ProjectID: projectID, Name: "My Flow", Data: models.RawJSON(`{"nodes":[],"edges":[]}`)}, nil
		},
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodGet, "/api/projects/proj-1/flows/flow-1", nil)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestFlowGet_NotFound(t *testing.T) {
	svc := &mockFlowService{
		getFn: func(ownerEmail, projectID, flowID string) (*models.Flow, error) {
			return nil, services.ErrFlowNotFound
		},
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodGet, "/api/projects/proj-1/flows/missing", nil)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestFlowUpdate_Success(t *testing.T) {
	svc := &mockFlowService{
		updateFn: func(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error) {
			return &models.Flow{ID: flowID, ProjectID: projectID, Name: name, Data: data}, nil
		},
	}
	r := newFlowTestRouter(svc)
	body := map[string]interface{}{
		"name": "Updated Flow",
		"data": map[string]interface{}{"nodes": []interface{}{}, "edges": []interface{}{}},
	}
	w := doRequest(r, http.MethodPut, "/api/projects/proj-1/flows/flow-1", body)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestFlowUpdate_NotFound(t *testing.T) {
	svc := &mockFlowService{
		updateFn: func(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error) {
			return nil, services.ErrFlowNotFound
		},
	}
	r := newFlowTestRouter(svc)
	body := map[string]interface{}{"name": "X", "data": nil}
	w := doRequest(r, http.MethodPut, "/api/projects/proj-1/flows/missing", body)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestFlowDelete_Success(t *testing.T) {
	svc := &mockFlowService{
		deleteFn: func(ownerEmail, projectID, flowID string) error { return nil },
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodDelete, "/api/projects/proj-1/flows/flow-1", nil)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w.Code)
	}
}

func TestFlowDelete_NotFound(t *testing.T) {
	svc := &mockFlowService{
		deleteFn: func(ownerEmail, projectID, flowID string) error { return services.ErrFlowNotFound },
	}
	r := newFlowTestRouter(svc)
	w := doRequest(r, http.MethodDelete, "/api/projects/proj-1/flows/missing", nil)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
