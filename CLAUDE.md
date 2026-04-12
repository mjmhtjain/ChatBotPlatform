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

Two services managed by Docker Compose: a React/Vite frontend (nginx, port 3000) and a Go/Gin backend (port 8080). PostgreSQL database via GORM.

### Backend (`backend/`)

**Module path:** `github.com/mjmhtjain/ChatBotPlatform/backend`  
**Key dependencies:** `gin v1.10.0` (pinned — v1.12+ requires Go ≥1.25, project uses Go 1.24), `golang-jwt/jwt v5`, `gorm.io/gorm`, `gorm.io/driver/postgres`, `github.com/google/uuid`

Dependency wiring flows in `cmd/main.go`: `config.Load()` → `database.Connect()` → services → handlers → `router.Setup()` → `r.Run()`.

**File map:**
- `internal/config/` — reads env vars into a `Config` struct (includes Postgres connection params)
- `internal/database/db.go` — `Connect(cfg)`: opens GORM connection, runs `AutoMigrate(&Project{})`
- `internal/models/project.go` — `Project{ID(uuid), Name, OwnerEmail, CreatedAt, UpdatedAt}`; unique index on `(owner_email, name)`
- `internal/services/auth.go` — credential validation (plain string compare) and HS256 JWT generation (24h expiry)
- `internal/services/project.go` — `Create/List/Rename/Delete`; sentinel errors: `ErrDuplicateName`, `ErrNotFound`
- `internal/handlers/auth.go` — `POST /api/auth/login`: binds JSON, calls service, returns `{"access_token": "..."}`
- `internal/handlers/project.go` — `List/Create/Rename/Delete`; consumer-side `ProjectServicer` interface defined here
- `internal/middleware/auth.go` — Bearer JWT validation; sets `"owner_email"` in Gin context from JWT `sub` claim
- `internal/middleware/cors.go` — CORS for `http://localhost:3000`, handles OPTIONS preflight
- `internal/router/router.go` — `Setup(r, authHandler, projectHandler, jwtSecret)`: all routes registered here

**API routes:**
```
POST   /api/auth/login     — public; returns {access_token}
GET    /api/projects        — JWT protected
POST   /api/projects        — JWT protected; body: {name}
PATCH  /api/projects/:id    — JWT protected; body: {name}
DELETE /api/projects/:id    — JWT protected; returns 204
```

**Adding a new route group:** add the handler struct as a parameter to `router.Setup()`, register routes there. Don't put routes in `main.go`.

**Backend tests** use `net/http/httptest` + a real Gin router (`gin.TestMode`). See `internal/handlers/auth_test.go` for the `newTestRouter()` / `postLogin()` helper pattern.

**Error handling conventions:** `ErrDuplicateName` → 409 Conflict, `ErrNotFound` → 404. Handlers use `errors.Is()`. Duplicate detection checks `gorm.ErrDuplicatedKey` OR PostgreSQL error code `23505`.

### Frontend (`frontend/src/`)

**Stack:** React 18, TypeScript, Vite, Tailwind v4, React Router v6, Axios, Vitest + Testing Library + jsdom

**File map:**
- `lib/api.ts` — Axios instance; base URL defaults to `http://localhost:8080` (override via `VITE_API_BASE_URL` at build time)
- `lib/auth.ts` — auth helpers (token storage)
- `pages/LoginPage.tsx` — calls `POST /api/auth/login`, stores token in `localStorage`, navigates to `/projects`
- `pages/ProjectsPage.tsx` — fetches `GET /api/projects`, manages modal state for create/rename/delete
- `components/projects/ProjectCard.tsx` — individual project card with rename/delete actions
- `components/projects/NewProjectModal.tsx` — `POST /api/projects`
- `components/projects/RenameProjectModal.tsx` — `PATCH /api/projects/:id`
- `components/projects/DeleteConfirmModal.tsx` — `DELETE /api/projects/:id`
- `components/layout/Layout.tsx`, `TopBar.tsx` — app shell
- `App.tsx` — exports both `default App` (with `BrowserRouter`) and `AppRoutes` (for testing with `MemoryRouter`)

**Frontend tests** mock `../lib/api` with `vi.mock`. The email input is `type="email"` — jsdom enforces HTML5 email validation, so tests must use a real email format (e.g. `admin@example.com`), not bare strings like `user`.

### Environment config

Backend config is read from `backend/.env` (gitignored). Docker Compose injects it via `env_file: - ./backend/.env`. The `.env.example` is the committed template. `VITE_API_BASE_URL` is baked into the frontend at `npm run build`.

## Development Status

- **Phase 1 (Auth):** Complete — login endpoint, JWT, CORS
- **Phase 2 (Projects CRUD):** Complete — PostgreSQL + GORM, full CRUD with ownership scoping
- **Phase 3:** Not started
