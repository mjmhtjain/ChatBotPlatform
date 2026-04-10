package services

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func newTestService() *AuthService {
	return NewAuthService("admin@example.com", "password", "test-secret")
}

func TestValidateCredentials(t *testing.T) {
	svc := newTestService()

	tests := []struct {
		name    string
		email   string
		password string
		wantErr bool
	}{
		{"valid credentials", "admin@example.com", "password", false},
		{"wrong password", "admin@example.com", "wrong", true},
		{"wrong email", "other@example.com", "password", true},
		{"both wrong", "other@example.com", "wrong", true},
		{"empty credentials", "", "", true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := svc.ValidateCredentials(tc.email, tc.password)
			if (err != nil) != tc.wantErr {
				t.Errorf("got err=%v, wantErr=%v", err, tc.wantErr)
			}
		})
	}
}

func TestGenerateToken(t *testing.T) {
	svc := newTestService()

	token, err := svc.GenerateToken("admin@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	// Parse the token and verify claims
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		return []byte("test-secret"), nil
	})
	if err != nil {
		t.Fatalf("token failed to parse: %v", err)
	}
	if !parsed.Valid {
		t.Fatal("expected token to be valid")
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("expected MapClaims")
	}
	if claims["sub"] != "admin@example.com" {
		t.Errorf("expected sub=admin@example.com, got %v", claims["sub"])
	}
}

func TestGenerateToken_WrongSecret(t *testing.T) {
	svc := newTestService()

	token, err := svc.GenerateToken("admin@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = jwt.Parse(token, func(t *jwt.Token) (any, error) {
		return []byte("wrong-secret"), nil
	})
	if err == nil {
		t.Fatal("expected error with wrong secret, got nil")
	}
}
