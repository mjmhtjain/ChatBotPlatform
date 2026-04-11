# Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full Projects CRUD — PostgreSQL persistence, Go backend endpoints (list/create/rename/delete), and a React card-grid UI with modals for create, rename, and delete.

**Architecture:** PostgreSQL is added as a third Docker Compose service; the Go backend connects via GORM, runs AutoMigrate on startup, and exposes four protected REST endpoints. The frontend replaces the Projects page placeholder with a card grid backed by local `useState`, calling the real API via Axios with a Bearer token interceptor.

**Tech Stack:** Go 1.24, Gin v1.10, GORM v2, gorm.io/driver/postgres, github.com/google/uuid, React 18, TypeScript, Tailwind v4, Axios, Vitest + Testing Library

---

## File Map

**New backend files:**
- `backend/internal/models/project.go` — Project GORM model
- `backend/internal/database/db.go` — GORM connection + AutoMigrate
- `backend/internal/middleware/auth.go` — JWT verification middleware
- `backend/internal/middleware/auth_test.go` — middleware tests
- `backend/internal/services/project.go` — project CRUD service + `ProjectServicer` interface
- `backend/internal/handlers/project.go` — project HTTP handlers
- `backend/internal/handlers/project_test.go` — handler tests

**Modified backend files:**
- `backend/internal/config/config.go` — add Postgres fields
- `backend/internal/router/router.go` — add project routes + auth middleware group
- `backend/cmd/main.go` — wire DB + project service/handler
- `backend/.env.example` — add Postgres vars
- `backend/.env` — add Postgres vars (gitignored)
- `backend/go.mod` / `backend/go.sum` — GORM, postgres driver, uuid

**Modified infra:**
- `docker-compose.yml` — add postgres service + volume

**New frontend files:**
- `frontend/src/components/projects/ProjectCard.tsx`
- `frontend/src/components/projects/NewProjectModal.tsx`
- `frontend/src/components/projects/RenameProjectModal.tsx`
- `frontend/src/components/projects/DeleteConfirmModal.tsx`
- `frontend/src/pages/ProjectsPage.test.tsx`

**Modified frontend files:**
- `frontend/src/lib/api.ts` — add Bearer token request interceptor
- `frontend/src/pages/ProjectsPage.tsx` — replace placeholder with real implementation

---

## Task 1: Add PostgreSQL to Docker Compose and env files

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/.env.example`
- Modify: `backend/.env`

- [ ] **Step 1: Update docker-compose.yml**

Replace the entire contents of `docker-compose.yml` with:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: chatbot
      POSTGRES_PASSWORD: chatbot
      POSTGRES_DB: chatbot
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "${BACKEND_PORT:-8080}:8080"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 2: Update backend/.env.example**

Replace the contents of `backend/.env.example` with:

```
# Port for backend application
PORT=8080

# Admin credentials
ADMIN_EMAIL=user@gmail.com
ADMIN_PASSWORD=password

# Auth
JWT_SECRET=change-me-in-production

# PostgreSQL (use service name 'postgres' when running via docker compose)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=chatbot
POSTGRES_PASSWORD=chatbot
POSTGRES_DB=chatbot
```

- [ ] **Step 3: Update backend/.env (the real local file)**

Add the same Postgres block to `backend/.env` (keep existing values for PORT, ADMIN_EMAIL, etc.):

```
# Port for backend application
PORT=8080

# Admin credentials
ADMIN_EMAIL=user@gmail.com
ADMIN_PASSWORD=password

# Auth
JWT_SECRET=dev-secret-change-in-prod

# PostgreSQL (use service name 'postgres' when running via docker compose)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=chatbot
POSTGRES_PASSWORD=chatbot
POSTGRES_DB=chatbot
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml backend/.env.example
git commit -m "feat: add PostgreSQL service to docker-compose and env template"
```

---

## Task 2: Add Go dependencies (GORM, postgres driver, UUID)

**Files:**
- Modify: `backend/go.mod`, `backend/go.sum`

- [ ] **Step 1: Install dependencies**

```bash
cd backend
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/google/uuid
go mod tidy
```

Expected: `go.mod` now lists `gorm.io/gorm`, `gorm.io/driver/postgres`, `github.com/google/uuid` as direct dependencies.

- [ ] **Step 2: Verify build still compiles**

```bash
cd backend
go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add go.mod go.sum
git commit -m "feat: add GORM, postgres driver, and uuid dependencies"
```

---

## Task 3: Extend Config with Postgres fields

**Files:**
- Modify: `backend/internal/config/config.go`

- [ ] **Step 1: Update Config struct and Load()**

Replace the contents of `backend/internal/config/config.go` with:

```go
package config

import "os"

type Config struct {
	AdminEmail    string
	AdminPassword string
	JWTSecret     string
	Port          string

	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
}

func Load() Config {
	return Config{
		AdminEmail:    getEnv("ADMIN_EMAIL", "user@gmail.com"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "password"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-in-prod"),
		Port:          getEnv("PORT", "8080"),

		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "chatbot"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "chatbot"),
		PostgresDB:       getEnv("POSTGRES_DB", "chatbot"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/config/config.go
git commit -m "feat: add PostgreSQL fields to Config"
```

---

## Task 4: Create Project model

**Files:**
- Create: `backend/internal/models/project.go`

- [ ] **Step 1: Create the model file**

Create `backend/internal/models/project.go`:

```go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Project struct {
	ID         string    `gorm:"primaryKey"                              json:"id"`
	Name       string    `gorm:"not null;uniqueIndex:idx_owner_name"      json:"name"`
	OwnerEmail string    `gorm:"not null;uniqueIndex:idx_owner_name"      json:"owner_email"`
	CreatedAt  time.Time `                                                json:"created_at"`
	UpdatedAt  time.Time `                                                json:"updated_at"`
}

func (p *Project) BeforeCreate(_ *gorm.DB) error {
	p.ID = uuid.New().String()
	return nil
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/models/project.go
git commit -m "feat: add Project GORM model with composite unique index"
```

---

## Task 5: Create database connection package

**Files:**
- Create: `backend/internal/database/db.go`

- [ ] **Step 1: Create the database package**

Create `backend/internal/database/db.go`:

```go
package database

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/config"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
)

func Connect(cfg config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.PostgresHost,
		cfg.PostgresPort,
		cfg.PostgresUser,
		cfg.PostgresPassword,
		cfg.PostgresDB,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.AutoMigrate(&models.Project{}); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return db, nil
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/database/db.go
git commit -m "feat: add database connection and AutoMigrate"
```

---

## Task 6: Create JWT auth middleware and tests

**Files:**
- Create: `backend/internal/middleware/auth.go`
- Create: `backend/internal/middleware/auth_test.go`

- [ ] **Step 1: Write the failing tests**

Create `backend/internal/middleware/auth_test.go`:

```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func init() {
	gin.SetMode(gin.TestMode)
}

const testSecret = "test-secret"

func makeToken(secret string, sub string, exp time.Time) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": sub,
		"exp": exp.Unix(),
		"iat": time.Now().Unix(),
	})
	signed, _ := token.SignedString([]byte(secret))
	return signed
}

func newAuthTestRouter() *gin.Engine {
	r := gin.New()
	r.Use(Auth(testSecret))
	r.GET("/protected", func(c *gin.Context) {
		email := c.GetString("owner_email")
		c.JSON(http.StatusOK, gin.H{"owner_email": email})
	})
	return r
}

func getProtected(r *gin.Engine, authHeader string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestAuth_ValidToken(t *testing.T) {
	r := newAuthTestRouter()
	token := makeToken(testSecret, "admin@example.com", time.Now().Add(time.Hour))
	w := getProtected(r, "Bearer "+token)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestAuth_MissingHeader(t *testing.T) {
	r := newAuthTestRouter()
	w := getProtected(r, "")
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuth_WrongScheme(t *testing.T) {
	r := newAuthTestRouter()
	token := makeToken(testSecret, "admin@example.com", time.Now().Add(time.Hour))
	w := getProtected(r, "Basic "+token)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuth_WrongSecret(t *testing.T) {
	r := newAuthTestRouter()
	token := makeToken("wrong-secret", "admin@example.com", time.Now().Add(time.Hour))
	w := getProtected(r, "Bearer "+token)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuth_ExpiredToken(t *testing.T) {
	r := newAuthTestRouter()
	token := makeToken(testSecret, "admin@example.com", time.Now().Add(-time.Hour))
	w := getProtected(r, "Bearer "+token)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && go test ./internal/middleware/... -v
```

Expected: compilation error (Auth function does not exist yet).

- [ ] **Step 3: Implement the middleware**

Create `backend/internal/middleware/auth.go`:

```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Auth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		email, ok := claims["sub"].(string)
		if !ok || email == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token subject"})
			return
		}

		c.Set("owner_email", email)
		c.Next()
	}
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd backend && go test ./internal/middleware/... -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/middleware/auth.go internal/middleware/auth_test.go
git commit -m "feat: add JWT auth middleware with tests"
```

---

## Task 7: Create Project service

**Files:**
- Create: `backend/internal/services/project.go`

- [ ] **Step 1: Create the service**

Create `backend/internal/services/project.go`:

```go
package services

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
)

var (
	ErrDuplicateName = errors.New("project name already exists")
	ErrNotFound      = errors.New("project not found")
)

type ProjectService struct {
	db *gorm.DB
}

func NewProjectService(db *gorm.DB) *ProjectService {
	return &ProjectService{db: db}
}

func (s *ProjectService) Create(ownerEmail, name string) (*models.Project, error) {
	p := &models.Project{Name: name, OwnerEmail: ownerEmail}
	if err := s.db.Create(p).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateName
		}
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) List(ownerEmail string) ([]models.Project, error) {
	var projects []models.Project
	err := s.db.
		Where("owner_email = ?", ownerEmail).
		Order("created_at desc").
		Find(&projects).Error
	return projects, err
}

func (s *ProjectService) Rename(ownerEmail, id, name string) (*models.Project, error) {
	var p models.Project
	if err := s.db.Where("id = ? AND owner_email = ?", id, ownerEmail).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	p.Name = name
	if err := s.db.Save(&p).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateName
		}
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Delete(ownerEmail, id string) error {
	result := s.db.Where("id = ? AND owner_email = ?", id, ownerEmail).Delete(&models.Project{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// isDuplicate detects unique constraint violations from PostgreSQL.
func isDuplicate(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	return strings.Contains(err.Error(), "23505")
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/services/project.go
git commit -m "feat: add ProjectService with CRUD operations"
```

---

## Task 8: Create Project handler and tests

**Files:**
- Create: `backend/internal/handlers/project.go`
- Create: `backend/internal/handlers/project_test.go`

- [ ] **Step 1: Write the failing handler tests**

Create `backend/internal/handlers/project_test.go`:

```go
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && go test ./internal/handlers/... -run TestProject -v
```

Expected: compilation error (ProjectHandler not yet defined).

- [ ] **Step 3: Implement the handler**

Create `backend/internal/handlers/project.go`:

```go
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd backend && go test ./internal/handlers/... -run TestProject -v
```

Expected: all 9 project handler tests PASS.

- [ ] **Step 5: Run the full backend test suite to check nothing broke**

```bash
cd backend && go test ./...
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/handlers/project.go internal/handlers/project_test.go
git commit -m "feat: add ProjectHandler with CRUD endpoints and tests"
```

---

## Task 9: Wire router and main.go

**Files:**
- Modify: `backend/internal/router/router.go`
- Modify: `backend/cmd/main.go`

- [ ] **Step 1: Update router.go**

Replace the contents of `backend/internal/router/router.go` with:

```go
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/middleware"
)

func Setup(r *gin.Engine, authHandler *handlers.AuthHandler, projectHandler *handlers.ProjectHandler, jwtSecret string) {
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
			}
		}
	}
}
```

- [ ] **Step 2: Update main.go**

Replace the contents of `backend/cmd/main.go` with:

```go
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

	r := gin.Default()
	r.Use(middleware.CORS("http://localhost:3000"))

	router.Setup(r, authHandler, projectHandler, cfg.JWTSecret)

	log.Printf("Backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

- [ ] **Step 3: Verify full build and tests**

```bash
cd backend && go build ./... && go test ./...
```

Expected: build succeeds, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add internal/router/router.go cmd/main.go
git commit -m "feat: wire project handler into router and main"
```

---

## Task 10: Add Bearer token interceptor to frontend API client

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Add the request interceptor**

Replace the contents of `frontend/src/lib/api.ts` with:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

- [ ] **Step 2: Run existing frontend tests to confirm nothing broke**

```bash
cd frontend && npm test
```

Expected: all existing tests PASS (the interceptor doesn't affect existing mocks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add Bearer token request interceptor to API client"
```

---

## Task 11: Replace ProjectsPage placeholder with real implementation

**Files:**
- Modify: `frontend/src/pages/ProjectsPage.tsx`

- [ ] **Step 1: Replace the placeholder**

Replace the entire contents of `frontend/src/pages/ProjectsPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import ProjectCard from '../components/projects/ProjectCard'
import NewProjectModal from '../components/projects/NewProjectModal'
import RenameProjectModal from '../components/projects/RenameProjectModal'
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal'

export interface Project {
  id: string
  name: string
  owner_email: string
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [renaming, setRenaming] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Project[]>('/api/projects')
      .then(res => setProjects(res.data))
      .catch(err => {
        if (err.response?.status === 401) navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function handleCreated(project: Project) {
    setProjects(prev => [...prev, project])
    setShowNew(false)
  }

  function handleRenamed(project: Project) {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p))
    setRenaming(null)
  }

  function handleDeleted(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Project
          </button>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onRename={() => setRenaming(p)}
                onDelete={() => setDeleting(p)}
              />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
      {renaming && (
        <RenameProjectModal
          project={renaming}
          onClose={() => setRenaming(null)}
          onRenamed={handleRenamed}
        />
      )}
      {deleting && (
        <DeleteConfirmModal
          project={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
```

Note: this will not compile until Tasks 12–15 create the imported components. That is expected at this step.

- [ ] **Step 2: Commit (even though it doesn't compile yet)**

```bash
git add src/pages/ProjectsPage.tsx
git commit -m "feat: replace ProjectsPage placeholder with card grid implementation"
```

---

## Task 12: Create ProjectCard component

**Files:**
- Create: `frontend/src/components/projects/ProjectCard.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/projects/ProjectCard.tsx`:

```tsx
import { Project } from '../../pages/ProjectsPage'

interface Props {
  project: Project
  onRename: () => void
  onDelete: () => void
}

export default function ProjectCard({ project, onRename, onDelete }: Props) {
  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl p-4 aspect-square flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Actions — visible on hover */}
      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onRename() }}
          aria-label="Rename project"
          className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          {/* Pencil icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          aria-label="Delete project"
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          {/* Trash icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
          </svg>
        </button>
      </div>

      {/* Project name */}
      <p className="text-sm font-medium text-gray-800 break-words">{project.name}</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: still fails because NewProjectModal, RenameProjectModal, DeleteConfirmModal don't exist yet. That is expected.

- [ ] **Step 3: Commit**

```bash
git add src/components/projects/ProjectCard.tsx
git commit -m "feat: add ProjectCard component"
```

---

## Task 13: Create NewProjectModal

**Files:**
- Create: `frontend/src/components/projects/NewProjectModal.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/projects/NewProjectModal.tsx`:

```tsx
import { useState } from 'react'
import api from '../../lib/api'
import { Project } from '../../pages/ProjectsPage'

interface Props {
  onClose: () => void
  onCreated: (project: Project) => void
}

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post<Project>('/api/projects', { name })
      onCreated(data)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A project with that name already exists.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Chatbot"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/projects/NewProjectModal.tsx
git commit -m "feat: add NewProjectModal component"
```

---

## Task 14: Create RenameProjectModal

**Files:**
- Create: `frontend/src/components/projects/RenameProjectModal.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/projects/RenameProjectModal.tsx`:

```tsx
import { useState } from 'react'
import api from '../../lib/api'
import { Project } from '../../pages/ProjectsPage'

interface Props {
  project: Project
  onClose: () => void
  onRenamed: (project: Project) => void
}

export default function RenameProjectModal({ project, onClose, onRenamed }: Props) {
  const [name, setName] = useState(project.name)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.patch<Project>(`/api/projects/${project.id}`, { name })
      onRenamed(data)
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('A project with that name already exists.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rename Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rename-project" className="block text-sm font-medium text-gray-700 mb-1.5">
              Project name
            </label>
            <input
              id="rename-project"
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/projects/RenameProjectModal.tsx
git commit -m "feat: add RenameProjectModal component"
```

---

## Task 15: Create DeleteConfirmModal

**Files:**
- Create: `frontend/src/components/projects/DeleteConfirmModal.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/projects/DeleteConfirmModal.tsx`:

```tsx
import { useState } from 'react'
import api from '../../lib/api'
import { Project } from '../../pages/ProjectsPage'

interface Props {
  project: Project
  onClose: () => void
  onDeleted: (id: string) => void
}

export default function DeleteConfirmModal({ project, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    try {
      await api.delete(`/api/projects/${project.id}`)
      onDeleted(project.id)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{project.name}</strong>? This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the full frontend build compiles**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```bash
cd frontend && npm test
```

Expected: all existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/DeleteConfirmModal.tsx
git commit -m "feat: add DeleteConfirmModal component"
```

---

## Task 16: Add ProjectsPage tests

**Files:**
- Create: `frontend/src/pages/ProjectsPage.test.tsx`

- [ ] **Step 1: Write the tests**

Create `frontend/src/pages/ProjectsPage.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProjectsPage from './ProjectsPage'

vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../lib/api'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const sampleProject = {
  id: 'proj-1',
  name: 'My Bot',
  owner_email: 'admin@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>
  )
}

afterEach(() => {
  vi.mocked(api.get).mockReset()
  vi.mocked(api.post).mockReset()
  vi.mocked(api.patch).mockReset()
  vi.mocked(api.delete).mockReset()
  mockNavigate.mockReset()
})

describe('ProjectsPage', () => {
  it('shows projects after loading', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [sampleProject] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('My Bot')).toBeInTheDocument()
    })
  })

  it('shows empty state when no projects', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    })
  })

  it('redirects to /login on 401', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 401 } })
    renderPage()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('creates a new project and appends it to the list', async () => {
    const newProject = { ...sampleProject, id: 'proj-2', name: 'New Bot' }
    vi.mocked(api.get).mockResolvedValue({ data: [sampleProject] })
    vi.mocked(api.post).mockResolvedValue({ data: newProject })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('My Bot')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/project name/i), 'New Bot')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText('New Bot')).toBeInTheDocument()
    })
  })

  it('shows 409 error on duplicate project name in create modal', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/project name/i), 'Duplicate')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(screen.getByText(/a project with that name already exists/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd frontend && npm test
```

Expected: all tests PASS, including the 5 new ProjectsPage tests.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProjectsPage.test.tsx
git commit -m "test: add ProjectsPage unit tests"
```

---

## Final Verification

- [ ] **Run all backend tests**

```bash
cd backend && go test ./... -v
```

Expected: all tests PASS.

- [ ] **Run all frontend tests**

```bash
cd frontend && npm test
```

Expected: all tests PASS.

- [ ] **Smoke test with docker compose**

```bash
docker compose up --build -d
```

Then open http://localhost:3000, log in, and verify:
- Projects page loads (empty state shown)
- Create a project → card appears
- Rename the project → name updates in place
- Delete the project → card disappears
- Creating a duplicate name → "A project with that name already exists." shown in modal
