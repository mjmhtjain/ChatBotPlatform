package config

import "os"

type Config struct {
	AdminEmail    string
	AdminPassword string
	JWTSecret     string
	Port          string
	CORSOrigin    string

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
		CORSOrigin:    getEnv("CORS_ORIGIN", "http://localhost:3000"),

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
