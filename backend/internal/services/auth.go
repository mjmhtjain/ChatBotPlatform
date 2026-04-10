package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService struct {
	adminEmail    string
	adminPassword string
	jwtSecret     []byte
}

func NewAuthService(email, password, secret string) *AuthService {
	return &AuthService{
		adminEmail:    email,
		adminPassword: password,
		jwtSecret:     []byte(secret),
	}
}

func (s *AuthService) ValidateCredentials(email, password string) error {
	if email != s.adminEmail || password != s.adminPassword {
		return errors.New("invalid credentials")
	}
	return nil
}

func (s *AuthService) GenerateToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"sub": email,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
