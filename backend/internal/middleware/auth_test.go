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
