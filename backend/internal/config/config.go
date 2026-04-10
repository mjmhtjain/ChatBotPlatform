package config

import "os"

type Config struct {
	AdminEmail    string
	AdminPassword string
	JWTSecret     string
	Port          string
}

func Load() Config {
	return Config{
		AdminEmail:    getEnv("ADMIN_EMAIL", "user@gmail.com"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "password"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-in-prod"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
