package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/services"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newTestRouter() *gin.Engine {
	svc := services.NewAuthService("admin@example.com", "password", "test-secret")
	h := NewAuthHandler(svc)
	r := gin.New()
	r.POST("/api/auth/login", h.Login)
	return r
}

func postLogin(r *gin.Engine, body any) *httptest.ResponseRecorder {
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestLogin_Success(t *testing.T) {
	r := newTestRouter()
	w := postLogin(r, map[string]string{"email": "admin@example.com", "password": "password"})

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp["access_token"] == "" {
		t.Error("expected non-empty access_token in response")
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	r := newTestRouter()
	w := postLogin(r, map[string]string{"email": "admin@example.com", "password": "wrong"})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestLogin_WrongEmail(t *testing.T) {
	r := newTestRouter()
	w := postLogin(r, map[string]string{"email": "other@example.com", "password": "password"})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestLogin_MissingFields(t *testing.T) {
	r := newTestRouter()

	tests := []struct {
		name string
		body any
	}{
		{"missing password", map[string]string{"email": "admin@example.com"}},
		{"missing email", map[string]string{"password": "password"}},
		{"empty body", map[string]string{}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w := postLogin(r, tc.body)
			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d", w.Code)
			}
		})
	}
}

func TestLogin_MalformedJSON(t *testing.T) {
	r := newTestRouter()
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}
