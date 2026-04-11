# Projects Page — Design Spec

**Date:** 2026-04-11  
**Phase:** 2 — Projects CRUD  
**Status:** Approved

---

## Overview

After login, the user lands on a Projects page that lists all their existing projects as a card grid. They can create a new project (name only), rename an existing project, and delete a project. All data is persisted in PostgreSQL. Project names must be unique per user.

---

## Backend

### Infrastructure

- Add a `postgres` service to `docker-compose.yml`.
- Backend connects to PostgreSQL via GORM on startup.
- `AutoMigrate` creates the `projects` table on first run.
- PostgreSQL connection details are read from individual env vars in `backend/.env`, consistent with the existing config pattern: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

### Project Model (`internal/models/project.go`)

| Column       | Type      | Constraints                          |
|--------------|-----------|--------------------------------------|
| id           | UUID      | Primary key                          |
| name         | VARCHAR   | NOT NULL                             |
| owner_email  | VARCHAR   | NOT NULL — taken from JWT `sub` claim |
| created_at   | TIMESTAMP |                                      |
| updated_at   | TIMESTAMP |                                      |

Unique index on `(owner_email, name)` — enforced at the database level.

### Auth Middleware (`internal/middleware/auth.go`)

- Verifies the JWT on every protected route.
- Extracts the `sub` claim (email) and injects it into the Gin context as `owner_email`.
- Returns `401 Unauthorized` if the token is missing, expired, or invalid.

### API Endpoints

All four routes sit under `/api/projects` and are protected by the auth middleware.

| Method | Path                  | Request body      | Success | Error cases                        |
|--------|-----------------------|-------------------|---------|------------------------------------|
| GET    | /api/projects         | —                 | 200     | 401                                |
| POST   | /api/projects         | `{ "name": "" }` | 201     | 400 (missing name), 401, 409 (duplicate name) |
| PATCH  | /api/projects/:id     | `{ "name": "" }` | 200     | 400, 401, 404 (not found or not owner), 409 |
| DELETE | /api/projects/:id     | —                 | 204     | 401, 404 (not found or not owner)  |

- `GET` returns only projects belonging to the authenticated user.
- `PATCH` and `DELETE` verify the project belongs to the authenticated user before acting (returns 404 if not, to avoid leaking existence).
- 409 Conflict is returned when a project with the same name already exists for that user.

### Router (`internal/router/router.go`)

`router.Setup()` gains a `*handlers.ProjectHandler` parameter. Project routes are registered under `/api/projects` with the auth middleware applied to the group.

---

## Frontend

### `ProjectsPage.tsx`

- Fetches `GET /api/projects` on mount; stores result in `useState<Project[]>`.
- Renders a responsive card grid.
- "New Project" `+` button in the top-right corner opens `NewProjectModal`.
- After each successful mutation, local state is updated directly (no full refetch):
  - Create → append new project to list.
  - Rename → update name in place.
  - Delete → remove card from list.

### `ProjectCard.tsx`

- Small tile showing the project name.
- Pencil icon button → opens `RenameProjectModal` pre-filled with current name.
- Trash icon button → opens `DeleteConfirmModal`.
- Clicking the card body does nothing for now (will navigate to flow builder in Phase 3).

### `NewProjectModal.tsx`

- Single text input: "Project name".
- Create button (disabled while submitting).
- Calls `POST /api/projects`.
- On 409: shows inline error "A project with that name already exists."
- On success: closes modal, appends project to list.

### `RenameProjectModal.tsx`

- Same layout as `NewProjectModal`, pre-filled with the current name.
- Save button (disabled while submitting).
- Calls `PATCH /api/projects/:id`.
- On 409: shows inline error "A project with that name already exists."
- On success: closes modal, updates name in list.

### `DeleteConfirmModal.tsx`

- Message: "Are you sure you want to delete *[Project Name]*? This cannot be undone."
- Cancel and Delete buttons.
- Calls `DELETE /api/projects/:id`.
- On success: closes modal, removes project from list.

### Auth header

`api.ts` needs to attach the JWT to every request. The Axios instance will read `localStorage.getItem('access_token')` and set `Authorization: Bearer <token>` via a request interceptor.

---

## Data Flow

```
ProjectsPage mounts
  → GET /api/projects (with Bearer token)
  → setState(projects)
  → render card grid

User clicks "+" → NewProjectModal
  → POST /api/projects { name }
  → on 201: setState([...projects, newProject])

User clicks pencil → RenameProjectModal (pre-filled)
  → PATCH /api/projects/:id { name }
  → on 200: setState(projects.map(update))

User clicks trash → DeleteConfirmModal
  → DELETE /api/projects/:id
  → on 204: setState(projects.filter(remove))
```

---

## Error Handling

| Scenario                        | Behaviour                                             |
|---------------------------------|-------------------------------------------------------|
| Network / 5xx error             | Modal stays open, generic "Something went wrong." shown |
| 409 Duplicate name              | Inline error in modal: "A project with that name already exists." |
| 401 on page load                | Catch in the fetch, call `navigate('/login')`         |
| 404 on mutate (stale state)     | Remove the card from local state, show toast (future) |

---

## What Is Not In Scope

- Pagination (no more than a few dozen projects expected at MVP).
- Project thumbnails or metadata beyond the name.
- Zustand store (deferred to Phase 3 when the flow builder also needs project data).
- Clicking a project card navigating anywhere (Phase 3).
