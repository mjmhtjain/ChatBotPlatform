package pact_test

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	appmodels "github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/config"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/database"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/handlers"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/router"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
	pactmodels "github.com/pact-foundation/pact-go/v2/models"
	"github.com/pact-foundation/pact-go/v2/provider"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestPactProvider(t *testing.T) {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		t.Fatalf("db connect: %v", err)
	}

	authSvc := services.NewAuthService(cfg.AdminEmail, cfg.AdminPassword, cfg.JWTSecret)
	projectSvc := services.NewProjectService(db)

	r := gin.New()
	router.Setup(r, handlers.NewAuthHandler(authSvc), handlers.NewProjectHandler(projectSvc), cfg.JWTSecret)

	srv := httptest.NewServer(r)
	defer srv.Close()

	token, err := authSvc.GenerateToken(cfg.AdminEmail)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	stateHandlers := pactmodels.StateHandlers{
		"valid credentials exist": func(setup bool, s pactmodels.ProviderState) (pactmodels.ProviderStateResponse, error) {
			return pactmodels.ProviderStateResponse{}, nil
		},
		"user has no projects": func(setup bool, s pactmodels.ProviderState) (pactmodels.ProviderStateResponse, error) {
			db.Where("owner_email = ?", cfg.AdminEmail).Delete(&appmodels.Project{})
			return pactmodels.ProviderStateResponse{}, nil
		},
		"user has one project": func(setup bool, s pactmodels.ProviderState) (pactmodels.ProviderStateResponse, error) {
			db.Where("owner_email = ?", cfg.AdminEmail).Delete(&appmodels.Project{})
			p := appmodels.Project{ID: "test-project-id", Name: "Test Project", OwnerEmail: cfg.AdminEmail}
			db.Create(&p)
			return pactmodels.ProviderStateResponse{}, nil
		},
	}

	pactFile, _ := filepath.Abs("../../../integration/pact/pacts/frontend-backend.json")

	verifier := provider.NewVerifier()
	err = verifier.VerifyProvider(t, provider.VerifyRequest{
		ProviderBaseURL: srv.URL,
		PactFiles:       []string{pactFile},
		StateHandlers:   stateHandlers,
		RequestFilter: func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/api/auth/login" {
					r.Header.Set("Authorization", "Bearer "+token)
				}
				next.ServeHTTP(w, r)
			})
		},
	})
	if err != nil {
		t.Fatal(err)
	}
}
