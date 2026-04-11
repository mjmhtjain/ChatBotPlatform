package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

// mockProjectService implements ProjectServicer for tests.
type mockProjectService struct {
	createFn func(ownerEmail, name string) (*models.Project, error)
	listFn   func(ownerEmail string) ([]models.Project, error)
	renameFn func(ownerEmail, id, name string) (*models.Project, error)
	deleteFn func(ownerEmail, id string) error
}

func (m *mockProjectService) Create(ownerEmail, name string) (*models.Project, error) {
	return m.createFn(ownerEmail, name)
}
func (m *mockProjectService) List(ownerEmail string) ([]models.Project, error) {
	return m.listFn(ownerEmail)
}
func (m *mockProjectService) Rename(ownerEmail, id, name string) (*models.Project, error) {
	return m.renameFn(ownerEmail, id, name)
}
func (m *mockProjectService) Delete(ownerEmail, id string) error {
	return m.deleteFn(ownerEmail, id)
}

func newProjectTestRouter(svc ProjectServicer) *gin.Engine {
	h := NewProjectHandler(svc)
	r := gin.New()
	// Simulate auth middleware injecting owner_email
	r.Use(func(c *gin.Context) {
		c.Set("owner_email", "admin@example.com")
		c.Next()
	})
	r.GET("/api/projects", h.List)
	r.POST("/api/projects", h.Create)
	r.PATCH("/api/projects/:id", h.Rename)
	r.DELETE("/api/projects/:id", h.Delete)
	return r
}

func doRequest(r *gin.Engine, method, path string, body any) *httptest.ResponseRecorder {
	var b []byte
	if body != nil {
		b, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestProjectList_Success(t *testing.T) {
	svc := &mockProjectService{
		listFn: func(ownerEmail string) ([]models.Project, error) {
			return []models.Project{{ID: "1", Name: "My Bot", OwnerEmail: ownerEmail}}, nil
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodGet, "/api/projects", nil)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var projects []models.Project
	if err := json.Unmarshal(w.Body.Bytes(), &projects); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if len(projects) != 1 || projects[0].Name != "My Bot" {
		t.Errorf("unexpected projects: %+v", projects)
	}
}

func TestProjectCreate_Success(t *testing.T) {
	svc := &mockProjectService{
		createFn: func(ownerEmail, name string) (*models.Project, error) {
			return &models.Project{ID: "new-id", Name: name, OwnerEmail: ownerEmail}, nil
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects", map[string]string{"name": "Test Bot"})

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var p models.Project
	json.Unmarshal(w.Body.Bytes(), &p)
	if p.Name != "Test Bot" {
		t.Errorf("expected name=Test Bot, got %s", p.Name)
	}
}

func TestProjectCreate_DuplicateName(t *testing.T) {
	svc := &mockProjectService{
		createFn: func(ownerEmail, name string) (*models.Project, error) {
			return nil, services.ErrDuplicateName
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects", map[string]string{"name": "Dup"})

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

func TestProjectCreate_MissingName(t *testing.T) {
	svc := &mockProjectService{
		createFn: func(ownerEmail, name string) (*models.Project, error) {
			return nil, nil
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPost, "/api/projects", map[string]string{})

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestProjectRename_Success(t *testing.T) {
	svc := &mockProjectService{
		renameFn: func(ownerEmail, id, name string) (*models.Project, error) {
			return &models.Project{ID: id, Name: name, OwnerEmail: ownerEmail}, nil
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPatch, "/api/projects/proj-1", map[string]string{"name": "New Name"})

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var p models.Project
	json.Unmarshal(w.Body.Bytes(), &p)
	if p.Name != "New Name" {
		t.Errorf("expected name=New Name, got %s", p.Name)
	}
}

func TestProjectRename_NotFound(t *testing.T) {
	svc := &mockProjectService{
		renameFn: func(ownerEmail, id, name string) (*models.Project, error) {
			return nil, services.ErrNotFound
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPatch, "/api/projects/missing", map[string]string{"name": "X"})

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestProjectRename_DuplicateName(t *testing.T) {
	svc := &mockProjectService{
		renameFn: func(ownerEmail, id, name string) (*models.Project, error) {
			return nil, services.ErrDuplicateName
		},
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodPatch, "/api/projects/proj-1", map[string]string{"name": "Dup"})

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

func TestProjectDelete_Success(t *testing.T) {
	svc := &mockProjectService{
		deleteFn: func(ownerEmail, id string) error { return nil },
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodDelete, "/api/projects/proj-1", nil)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w.Code)
	}
}

func TestProjectDelete_NotFound(t *testing.T) {
	svc := &mockProjectService{
		deleteFn: func(ownerEmail, id string) error { return services.ErrNotFound },
	}
	r := newProjectTestRouter(svc)
	w := doRequest(r, http.MethodDelete, "/api/projects/missing", nil)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
