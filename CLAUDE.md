# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ChatBotPlatform is a web app for building chatbot flows. Users log in, create Projects, and within each Project build named conversational Flows on a drag-and-drop canvas.

**What works end-to-end today:** login with JWT auth → projects CRUD → per-project flow CRUD → full-screen React Flow canvas editor with Message Nodes → canvas state persisted to PostgreSQL as JSONB.

**What's next:** Phase 4 — additional node types, more complex flow logic, and the Endpoint tab (chatbot integration/testing).

---

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

---

## Architecture

Two services managed by Docker Compose: a React/Vite frontend (nginx, port 3000) and a Go/Gin backend (port 8080). PostgreSQL is the third Docker Compose service.

### Auth & Ownership Model

1. `POST /api/auth/login` — `AuthService` compares credentials against env-var-configured admin email/password; returns a signed HS256 JWT (24h expiry) with `sub` = email
2. Frontend stores the token in `localStorage`; `api.ts` Axios interceptor attaches it as `Authorization: Bearer <token>` on every request
3. `middleware.Auth(jwtSecret)` validates the JWT and sets `c.Set("owner_email", email)` from the `sub` claim
4. All project and flow service methods accept `ownerEmail` as their first arg and filter DB queries by it — ownership is enforced at the service layer, not just the handler layer
5. `FlowService.verifyProjectOwner()` returns `ErrFlowNotFound` (not "forbidden") for both missing and unauthorized projects, preventing info leakage

### Backend (`backend/`)

**Module:** `github.com/mjmhtjain/ChatBotPlatform/backend`  
**Wiring:** `config.Load()` → `database.Connect()` → services → handlers → `router.Setup()` → `r.Run()`  
**Key deps:** `gin v1.10.0` (pinned — v1.12+ requires Go ≥1.25, project uses Go 1.24), `golang-jwt/jwt v5`, `gorm v1.31.1`, `gorm/driver/postgres`, `google/uuid`

**File map:**
- `cmd/main.go` — wires config → DB → services → handlers → router; CORS middleware applied globally for `http://localhost:3000`
- `internal/config/config.go` — reads env vars into `Config`; all fields have safe local-dev defaults
- `internal/database/db.go` — opens PostgreSQL via GORM, runs `AutoMigrate(&Project{}, &Flow{})`
- `internal/models/project.go` — `Project{ID, Name, OwnerEmail, CreatedAt, UpdatedAt}`; UUID assigned in `BeforeCreate`; unique index on `(owner_email, name)`
- `internal/models/flow.go` — `Flow{ID, ProjectID, Name, Data RawJSON, CreatedAt, UpdatedAt}`; unique index on `(project_id, name)`; `RawJSON` is `[]byte` with `driver.Valuer`/`sql.Scanner`/`json.Marshaler` for JSONB pass-through
- `internal/middleware/cors.go` — sets CORS headers for `http://localhost:3000`, handles OPTIONS preflight
- `internal/middleware/auth.go` — validates Bearer JWT, sets `owner_email` in Gin context
- `internal/services/auth.go` — plain-string credential compare + `jwt.NewWithClaims`; `sub` claim = email
- `internal/services/project.go` — `List/Create/Rename/Delete`; `isDuplicate()` helper used by both project and flow services
- `internal/services/flow.go` — `List/Create/Get/Update/Delete`; all methods call `verifyProjectOwner` first; `List` omits `data` column for performance; `Update` only overwrites `Data` when caller passes non-nil
- `internal/handlers/auth.go` — `POST /api/auth/login`; returns `{"access_token": "..."}`
- `internal/handlers/project.go` — `ProjectServicer` interface (consumer-side); CRUD handlers
- `internal/handlers/flow.go` — `FlowServicer` interface (consumer-side); reads `c.Param("id")` for project ID and `c.Param("flowId")` for flow ID
- `internal/router/router.go` — `Setup(r, authHandler, projectHandler, flowHandler, jwtSecret)`; add new handlers as parameters here

**API routes:**
```
POST   /api/auth/login                         (public)  login, returns JWT
GET    /api/projects                           (auth)    list caller's projects
POST   /api/projects                           (auth)    create project
PATCH  /api/projects/:id                       (auth)    rename project
DELETE /api/projects/:id                       (auth)    delete project
GET    /api/projects/:id/flows                 (auth)    list flows (no data blob)
POST   /api/projects/:id/flows                 (auth)    create flow
GET    /api/projects/:id/flows/:flowId         (auth)    get flow with canvas data
PUT    /api/projects/:id/flows/:flowId         (auth)    update flow name and/or canvas data
DELETE /api/projects/:id/flows/:flowId         (auth)    delete flow
```

**Error conventions:** `ErrFlowNotFound`, `ErrFlowDuplicateName` in `services/flow.go`; service sentinel errors mapped to HTTP status in handlers  
**Tests:** `handlers/*_test.go` use `net/http/httptest` + real Gin router in `gin.TestMode`; mock services use function-field structs (e.g. `mockFlowService{listFn: ...}`); `doRequest()` helper defined in `project_test.go` and reused in `flow_test.go`

**Adding a new route group:** add the handler struct as a parameter to `router.Setup()`, register routes there. Do not put routes in `main.go`.

### Frontend (`frontend/src/`)

**Stack:** React 18, TypeScript, Vite, Tailwind v4, React Router v6, Axios, @xyflow/react 12, Vitest + Testing Library + jsdom

**File map:**
- `App.tsx` — exports `AppRoutes` (for tests with `MemoryRouter`) and `default App` (wraps in `BrowserRouter`); routes: `/login`, `/projects`, `/projects/:projectId`, `/projects/:projectId/flows/:flowId`
- `lib/api.ts` — Axios instance (base URL `http://localhost:8080`, overridable via `VITE_API_BASE_URL`); JWT interceptor; project + flow API functions
- `lib/auth.ts` — `getInitials(token)` and `getEmail(token)`: decode JWT client-side without verifying signature; check `email` claim, fall back to `sub`
- `types/flow.ts` — `FlowMeta` (list response, no data), `Flow extends FlowMeta` (with `ReactFlowJsonObject | null`), `MessageNodeData`
- `pages/LoginPage.tsx` — calls `POST /api/auth/login`, stores token in `localStorage`, navigates to `/projects`
- `pages/ProjectsPage.tsx` — lists projects; `NewProjectModal`, `RenameProjectModal`, `DeleteConfirmModal`
- `pages/ProjectDetailPage.tsx` — tabs: Flow (renders `FlowListView`) and Endpoint (placeholder); back button navigates to `/projects`
- `pages/FlowEditorPage.tsx` — full-screen canvas; wraps `FlowEditorInner` in `ReactFlowProvider`; loads flow on mount, saves via `rfInstance.toObject()` → `updateFlow`
- `components/layout/Layout.tsx` — shell with `TopBar`; applied to all pages except `FlowEditorPage`
- `components/layout/TopBar.tsx` — app title + avatar dropdown showing email and logout
- `components/projects/ProjectCard.tsx` — click navigates to `/projects/:id`; rename/delete action buttons
- `components/projects/NewProjectModal.tsx` — creates project, 409 → inline duplicate error
- `components/projects/RenameProjectModal.tsx` — renames project
- `components/projects/DeleteConfirmModal.tsx` — confirms before delete
- `components/flows/FlowListView.tsx` — fetches flows, renders `FlowCard` list; create navigates to editor
- `components/flows/FlowCard.tsx` — shows name + updated date; open/rename/delete callbacks
- `components/flows/NewFlowModal.tsx` — creates flow, navigates to editor on success
- `components/flows/RenameFlowModal.tsx` — sends `{ name }` only; backend preserves existing canvas data
- `components/flows/DeleteFlowModal.tsx` — confirms before delete
- `components/flow-editor/FlowEditorTopBar.tsx` — back button (with unsaved-changes guard), read-only flow name, Save button
- `components/flow-editor/NodePalette.tsx` — drag source for node types; uses HTML5 `dataTransfer.setData('application/reactflow-nodetype', nodeType)`
- `components/flow-editor/FlowCanvas.tsx` — `ReactFlow` instance; `onDrop` reads `application/reactflow-nodetype`, creates node at drop position via `screenToFlowPosition`; imports `@xyflow/react/dist/style.css`
- `components/flow-editor/MessageNode.tsx` — custom node: target handle (top) + source handle (bottom); shows `data.message` or italic placeholder; indigo border when selected
- `components/flow-editor/NodeConfigPanel.tsx` — right panel; renders config form for selected node type (messageNode: textarea); returns null if no node selected

**Tests:** mock `../lib/api` with `vi.mock`; email inputs are `type="email"` — jsdom enforces HTML5 validation, use `admin@example.com` format not bare strings

### Environment

Backend config from `backend/.env` (gitignored). Docker Compose injects via `env_file: ./backend/.env`. `.env.example` is the committed template. `VITE_API_BASE_URL` is baked into the frontend at `npm run build`.

---

## Key Gotchas

- **`gin v1.10.0` is pinned** — v1.12+ requires Go ≥1.25; this project uses Go 1.24. Do not upgrade Gin.
- **Gin wildcard params must share a name at the same path level** — flows group uses `/:id/flows` (not `/:projectId/flows`) because `/:id` is already registered for PATCH/DELETE on projects. Mixing names causes a startup panic.
- **Flow `Update` only writes `Data` if non-nil** — `PUT /flows/:flowId` is used for both rename-only and canvas save. Rename sends no `data`; the service guards `if data != nil { f.Data = data }` to avoid wiping stored JSONB.
- **`FlowList` omits the `data` column** — uses `.Select("id, project_id, name, created_at, updated_at")` to avoid fetching large JSONB blobs on list views.
- **Consumer-side interfaces** — `ProjectServicer` and `FlowServicer` are defined in the handler package, not the service package. This keeps handlers testable with simple mock structs without importing the real service.
- **`owner_email` comes from JWT `sub` claim** — set by `middleware.Auth` via `c.Set("owner_email", email)`; handlers read it with `c.GetString("owner_email")`.
- **`FlowEditorPage` has no Layout wrapper** — it is intentionally full-screen. All other pages are wrapped in `<Layout>`.
- **`AppRoutes` vs `App`** — tests import `AppRoutes` with a `MemoryRouter`; `App` is the browser entry point with `BrowserRouter`.
- **jsdom email validation** — `type="email"` inputs reject bare strings like `user`; tests must use valid emails like `admin@example.com`.
- **`doRequest()` helper is in `project_test.go`** — flow tests reuse it because both files are in `package handlers`; don't duplicate it.

---

## Development Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Auth | Complete | Login with hardcoded env-var credentials, JWT issued, stored in localStorage |
| Phase 2 — Projects CRUD | Complete | PostgreSQL + GORM, project model, full REST API, owner-scoped, handler tests |
| Phase 3 — Flow Builder | Complete | Flow CRUD per project, React Flow canvas editor, Message Node, JSONB persistence |
| Phase 4 — Additional Nodes & Endpoint | Not started | More node types, chatbot endpoint integration/testing |
