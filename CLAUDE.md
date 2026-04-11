# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running the application
```sh
cp backend/.env.example backend/.env   # first time only
docker compose up --build
```

### Frontend (from `frontend/`)
```sh
npm test              # run all tests once
npm run test:watch    # watch mode
npm run dev           # local dev server (port 5173)
npm run build         # type-check + production build
```

### Backend (from `backend/`)
```sh
go test ./...                                    # all tests
go test ./internal/services/...                  # single package
go test -run TestLogin_Success ./internal/handlers/...  # single test
go build ./cmd/...                               # compile check
```

## Architecture

Two services managed by Docker Compose: a React/Vite frontend (nginx, port 3000) and a Go/Gin backend (port 8080). No database yet — auth uses hardcoded credentials from env vars.

### Backend (`backend/`)

**Module path:** `github.com/mjmhtjain/ChatBotPlatform/backend`  
**Key dependencies:** `gin v1.10.0` (pinned — v1.12+ requires Go ≥1.25, project uses Go 1.24), `golang-jwt/jwt v5`

Dependency wiring flows in `cmd/main.go`: `config.Load()` → services → handlers → `router.Setup()` → `r.Run()`.

- `internal/config/` — reads env vars into a `Config` struct; defaults are safe for local dev
- `internal/services/auth.go` — credential validation (plain string compare) and HS256 JWT generation (24h expiry)
- `internal/handlers/auth.go` — `POST /api/auth/login`: binds JSON, calls service, returns `{"access_token": "..."}`
- `internal/middleware/cors.go` — CORS for `http://localhost:3000`, handles OPTIONS preflight
- `internal/router/router.go` — `Setup(r, authHandler)`: all route registration lives here; add new handlers as parameters when extending

**Adding a new route group:** add the handler struct as a parameter to `router.Setup()`, register routes there. Don't put routes in `main.go`.

**Backend tests** use `net/http/httptest` + a real Gin router (`gin.TestMode`). See `internal/handlers/auth_test.go` for the `newTestRouter()` / `postLogin()` helper pattern.

### Frontend (`src/`)

**Stack:** React 18, TypeScript, Vite, Tailwind v4, React Router v6, Axios, Zustand (planned), Vitest + Testing Library + jsdom

- `src/lib/api.ts` — Axios instance; base URL defaults to `http://localhost:8080` (override via `VITE_API_BASE_URL` at build time)
- `src/pages/LoginPage.tsx` — calls `POST /api/auth/login`, stores token in `localStorage`, navigates to `/projects`
- `src/App.tsx` — exports both `default App` (with `BrowserRouter`) and `AppRoutes` (for testing with `MemoryRouter`)

**Frontend tests** mock `../lib/api` with `vi.mock`. The email input is `type="email"` — jsdom enforces HTML5 email validation, so tests must use a real email format (e.g. `admin@example.com`), not bare strings like `user`.

### Environment config

Backend config is read from `backend/.env` (gitignored). Docker Compose injects it via `env_file: - ./backend/.env`. The `.env.example` is the committed template. `VITE_API_BASE_URL` is baked into the frontend at `npm run build`.

## Development Plan

See [.doc/PLAN.md](.doc/PLAN.md) for the full phased roadmap. Current status: Phase 1 (Auth) complete. Next: Phase 2 — Projects CRUD (PostgreSQL + GORM, project model, `GET/POST/PATCH/DELETE /api/projects`).
