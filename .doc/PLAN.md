# Chatbot Builder Platform — Plan

## Overview

A web platform where an admin can build chatbot conversation flows visually, test them in the browser, and publish them as shareable chat links.

---

## Architecture

### Services

Two independent services managed via Docker Compose:

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   Frontend   │      │   Backend    │                 │
│  │  React/Vite  │ ───► │   Go + Gin   │                 │
│  │  :3000       │      │   :8080      │                 │
│  └──────────────┘      └──────┬───────┘                 │
│                               │                         │
│                        ┌──────▼───────┐                 │
│                        │  PostgreSQL  │                 │
│                        │   :5432      │                 │
│                        └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### Backend Structure (`backend/`)

```
backend/
  cmd/
    main.go                  # Entry point: DB connect → seed → start server
  internal/
    config/
      config.go              # Read env vars into a Config struct
    database/
      db.go                  # GORM connection + AutoMigrate
    models/
      user.go
      project.go
      flow.go                # Flow, FlowNode, FlowEdge
      chat.go                # ChatSession, ChatMessage
    handlers/
      auth.go                # Login, refresh, logout, /me
      projects.go            # CRUD
      flows.go               # Get, save, publish
      chat.go                # Create session, send message
    services/
      auth.go                # Password hashing, JWT generation/verification
      flow_executor.go       # State machine: traverse nodes to produce bot messages
    middleware/
      auth.go                # JWT verification — protects routes
      cors.go                # CORS for frontend origin
    seed/
      admin.go               # Create default admin user if none exists
  go.mod
  go.sum
  Dockerfile
```

### Frontend Structure (`frontend/`)

```
frontend/
  src/
    main.tsx                 # React entry point
    App.tsx                  # Router: all routes defined here
    pages/
      LoginPage.tsx
      ProjectsPage.tsx
      FlowBuilderPage.tsx
      TestChatPage.tsx
      PublishedChatPage.tsx
    components/
      flow/
        FlowCanvas.tsx       # React Flow canvas wrapper
        NodePalette.tsx      # Sidebar: drag nodes onto canvas
        PropertyPanel.tsx    # Sidebar: edit selected node's properties
        nodes/
          StartNode.tsx
          SayNode.tsx
          EndNode.tsx
      chat/
        ChatWindow.tsx
        ChatInput.tsx
      layout/
        AppLayout.tsx        # Navbar + protected route wrapper
    store/
      authStore.ts           # Zustand: accessToken, user, login/logout actions
      flowStore.ts           # Zustand: nodes, edges, isDirty
    lib/
      api.ts                 # Axios instance: base URL + auth interceptor
  package.json
  vite.config.ts
  Dockerfile
```

---

## Database Design

### Entity Relationship Diagram

```
users
  └── projects (one user → many projects)
        └── flows (one project → one flow for now)
              ├── flow_nodes (one flow → many nodes)
              └── flow_edges (one flow → many edges, source/target → flow_nodes)

chat_sessions → flows
chat_messages → chat_sessions
```

### Tables

#### `users`
| Column     | Type      | Constraints         |
|------------|-----------|---------------------|
| id         | UUID      | PK                  |
| email      | VARCHAR   | UNIQUE NOT NULL      |
| password   | VARCHAR   | NOT NULL (bcrypt)   |
| name       | VARCHAR   | NOT NULL            |
| is_admin   | BOOLEAN   | DEFAULT false       |
| created_at | TIMESTAMP |                     |
| updated_at | TIMESTAMP |                     |

#### `projects`
| Column     | Type      | Constraints         |
|------------|-----------|---------------------|
| id         | UUID      | PK                  |
| name       | VARCHAR   | NOT NULL            |
| user_id    | UUID      | FK → users.id       |
| created_at | TIMESTAMP |                     |
| updated_at | TIMESTAMP |                     |

#### `flows`
| Column       | Type      | Constraints         |
|--------------|-----------|---------------------|
| id           | UUID      | PK                  |
| project_id   | UUID      | FK → projects.id    |
| name         | VARCHAR   | NOT NULL            |
| status       | VARCHAR   | DEFAULT 'draft'     |
| version      | INT       | DEFAULT 0           |
| published_at | TIMESTAMP | NULLABLE            |
| created_at   | TIMESTAMP |                     |
| updated_at   | TIMESTAMP |                     |

> `status` values: `draft` | `published`

#### `flow_nodes`
| Column     | Type      | Constraints         |
|------------|-----------|---------------------|
| id         | UUID      | PK                  |
| flow_id    | UUID      | FK → flows.id       |
| type       | VARCHAR   | NOT NULL            |
| position_x | FLOAT     |                     |
| position_y | FLOAT     |                     |
| data       | JSONB     | node-type payload   |
| created_at | TIMESTAMP |                     |
| updated_at | TIMESTAMP |                     |

> `type` values (MVP): `start` | `say` | `end`
> `data` examples:
> - start node: `{}`
> - say node: `{ "message": "Hello!" }`
> - end node: `{}`

#### `flow_edges`
| Column         | Type      | Constraints         |
|----------------|-----------|---------------------|
| id             | UUID      | PK                  |
| flow_id        | UUID      | FK → flows.id       |
| source_node_id | UUID      | FK → flow_nodes.id  |
| target_node_id | UUID      | FK → flow_nodes.id  |
| created_at     | TIMESTAMP |                     |

#### `chat_sessions`
| Column          | Type      | Constraints         |
|-----------------|-----------|---------------------|
| id              | UUID      | PK                  |
| flow_id         | UUID      | FK → flows.id       |
| is_test         | BOOLEAN   | DEFAULT false       |
| current_node_id | UUID      | NULLABLE            |
| created_at      | TIMESTAMP |                     |
| updated_at      | TIMESTAMP |                     |

#### `chat_messages`
| Column     | Type      | Constraints         |
|------------|-----------|---------------------|
| id         | UUID      | PK                  |
| session_id | UUID      | FK → chat_sessions.id |
| role       | VARCHAR   | `bot` or `user`     |
| content    | TEXT      | NOT NULL            |
| created_at | TIMESTAMP |                     |

---

## API Design

### Auth
| Method | Path                  | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| POST   | /api/auth/login       | No   | Returns access token, sets refresh cookie |
| POST   | /api/auth/refresh     | No   | Reads refresh cookie, returns new access token |
| POST   | /api/auth/logout      | No   | Clears refresh cookie              |
| GET    | /api/auth/me          | Yes  | Returns current user info          |

### Projects
| Method | Path               | Auth | Description          |
|--------|--------------------|------|----------------------|
| GET    | /api/projects      | Yes  | List user's projects |
| POST   | /api/projects      | Yes  | Create project       |
| PATCH  | /api/projects/:id  | Yes  | Rename project       |
| DELETE | /api/projects/:id  | Yes  | Delete project       |

### Flows
| Method | Path                                    | Auth | Description                       |
|--------|-----------------------------------------|------|-----------------------------------|
| GET    | /api/projects/:projectId/flow           | Yes  | Get flow with nodes + edges        |
| PUT    | /api/projects/:projectId/flow           | Yes  | Full replace: save entire canvas  |
| POST   | /api/projects/:projectId/flow/publish   | Yes  | Publish the flow                  |

### Chat
| Method | Path                              | Auth | Description                             |
|--------|-----------------------------------|------|-----------------------------------------|
| POST   | /api/chat/sessions                | No   | Start a chat session (test or public)   |
| POST   | /api/chat/sessions/:id/message    | No   | Send a user message, get bot response   |

---

## Frontend Routes

| Route                        | Auth Required | Description                          |
|------------------------------|---------------|--------------------------------------|
| /                            | —             | Redirect → /login or /projects        |
| /login                       | No            | Admin login page                     |
| /projects                    | Yes           | Project list                         |
| /projects/:projectId         | Yes           | Flow builder canvas                  |
| /projects/:projectId/test    | Yes           | In-browser flow test chat            |
| /chat/:flowId                | No            | Public published chatbot             |

---

## Flow Node Types (MVP)

| Node   | Canvas handles         | Property panel field  | Behaviour during execution                  |
|--------|------------------------|-----------------------|---------------------------------------------|
| Start  | 1 output               | —                     | Entry point. Execution begins here.         |
| Say    | 1 input, 1 output      | Message (text)        | Adds its message to the bot response list.  |
| End    | 1 input                | —                     | Execution terminates.                       |

MVP flows are **linear** (Start → Say → Say → ... → End). No branching.

---

## Execution Engine

The engine lives in `backend/internal/services/flow_executor.go`. It is a simple graph traversal:

1. Load all `flow_nodes` and `flow_edges` for the flow into memory.
2. Find the node with `type = "start"`.
3. Walk edges: at each node, collect its output (Say → append message to list).
4. Stop when reaching an `End` node or a dead-end.
5. Return the list of bot messages to the caller.

Because the MVP has no `Input` nodes, the entire flow executes in one shot when a session is created. The engine is written to accommodate `Input` nodes in a future phase (it will pause and store `current_node_id` when it reaches an Input node waiting for user input).

---

## Implementation Phases

### Phase 1 — Scaffold + Auth

**Goal:** `docker compose up` works. Admin can log in and land on a placeholder Projects page.

#### Mini-milestones
1. **Repo structure** — Create `backend/` and `frontend/` directories. Add `docker-compose.yml` and `.env.example`.
2. **Go module init** — `go mod init`, add Gin and GORM dependencies.
3. **Config** — `internal/config/config.go` reads env vars into a struct.
4. **Database connection** — `internal/database/db.go` connects via GORM, runs `AutoMigrate` for the `User` model.
5. **User model** — `internal/models/user.go`.
6. **Admin seed** — `internal/seed/admin.go` creates the admin if none exists.
7. **Auth service** — `internal/services/auth.go`: bcrypt helpers, JWT sign/verify.
8. **Auth handlers** — `internal/handlers/auth.go`: `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`.
9. **JWT middleware** — `internal/middleware/auth.go`.
10. **Main entry point** — `cmd/main.go` wires everything up.
11. **Frontend scaffold** — Vite + React + TypeScript + Tailwind + React Router.
12. **API client** — `src/lib/api.ts`: Axios instance with base URL and auth interceptor.
13. **Auth store** — `src/store/authStore.ts`: Zustand store for `accessToken` and user.
14. **Login page** — `src/pages/LoginPage.tsx` wired to `POST /api/auth/login`.
15. **Route protection** — Redirect unauthenticated users to `/login`.
16. **Placeholder Projects page** — Simple page showing "Projects" heading.
17. **Dockerfiles** — `backend/Dockerfile` and `frontend/Dockerfile`.

**Milestone checkpoint:** `docker compose up` → open `http://localhost:3000` → log in with admin credentials → land on `/projects`.

---

### Phase 2 — Projects CRUD

**Goal:** Admin can create, rename, and delete projects.

#### Mini-milestones
1. **Project model** — Add `Project` to `internal/models/project.go`, update `AutoMigrate`.
2. **Projects handlers** — `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`.
3. **Auto-create flow** — When a project is created, also create an empty `Flow` record (status=draft).
4. **Projects page** — Card grid of projects, "New Project" button, inline rename, delete with confirmation modal.
5. **Project navigation** — Clicking a project card navigates to `/projects/:projectId` (placeholder for now).

**Milestone checkpoint:** Create "Demo", rename it to "Hello World", delete it, create again — all persist across page reloads.

---

### Phase 3 — Flow Builder Canvas

**Goal:** Admin can build a flow visually and save it.

#### Mini-milestones
1. **Flow models** — Add `Flow`, `FlowNode`, `FlowEdge` to models, update `AutoMigrate`.
2. **Flow handlers** — `GET /api/projects/:projectId/flow` and `PUT /api/projects/:projectId/flow`.
3. **React Flow install** — Add `@xyflow/react` to frontend.
4. **Custom node components** — `StartNode.tsx`, `SayNode.tsx`, `EndNode.tsx`.
5. **FlowCanvas** — React Flow canvas with custom node types registered.
6. **NodePalette** — Left sidebar with draggable "Say" node item.
7. **PropertyPanel** — Right sidebar: shows message text field when a Say node is selected.
8. **Flow store** — `src/store/flowStore.ts`: Zustand holding `nodes`, `edges`, `isDirty`.
9. **Load flow on mount** — `GET /flow` on page load, populate canvas.
10. **Save flow** — `PUT /flow` on Save button click + auto-save debounce (2 seconds).

**Milestone checkpoint:** Drag Start → Say ("Hello!") → End onto canvas, save, reload page — canvas restores correctly.

---

### Phase 4 — Execution Engine + Test Chat

**Goal:** Admin can test a flow in the browser.

#### Mini-milestones
1. **Chat models** — Add `ChatSession` and `ChatMessage`, update `AutoMigrate`.
2. **Flow executor service** — `flow_executor.go`: load graph, traverse from Start, collect Say messages, stop at End.
3. **Chat handlers** — `POST /api/chat/sessions` and `POST /api/chat/sessions/:id/message`.
4. **Test Chat page** — Split view: read-only canvas on the left (active node highlighted), chat bubbles on the right.
5. **Chat components** — `ChatWindow.tsx` and `ChatInput.tsx`.
6. **"Test" button** — In the flow builder toolbar, links to `/projects/:projectId/test`.

**Milestone checkpoint:** Build a flow Start → Say("Hi!") → Say("How can I help?") → End, click Test — both messages appear in the chat window.

---

### Phase 5 — Publishing

**Goal:** Admin can publish a flow and share it via URL.

#### Mini-milestones
1. **Publish endpoint** — `POST /api/projects/:projectId/flow/publish`: set `status=published`, increment version, stamp `published_at`.
2. **Publish button** — In the flow builder toolbar.
3. **Post-publish modal** — Shows the shareable URL `http://localhost:3000/chat/:flowId`.
4. **Published Chat page** — `src/pages/PublishedChatPage.tsx`: no auth required, minimal UI, loads flow by ID.

**Milestone checkpoint:** Publish flow, copy URL, open in incognito window — bot messages appear.

---

### Phase 6 — Polish (ongoing)

- Loading spinners and error boundaries on all pages
- Prevent publishing flows with no Start node or disconnected nodes
- Axios interceptor: auto-refresh access token on 401
- Rate limiting on chat endpoint (Gin middleware)
- `.env` validation on backend startup (fail fast if required vars are missing)

---

## Verification Checklist (End-to-End)

- [ ] `cp .env.example .env && docker compose up` — all three containers start cleanly
- [ ] `http://localhost:3000` — redirects to `/login`
- [ ] Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` — lands on `/projects`
- [ ] Create project "Demo" — appears in list
- [ ] Rename "Demo" to "Hello World" — persists on reload
- [ ] Delete "Hello World" — gone from list
- [ ] Create project "Test Bot", open it
- [ ] Drag: Start → Say ("Welcome!") → Say ("How can I help?") → End → Save
- [ ] Reload page — canvas restores correctly
- [ ] Click "Test" — both Say messages appear in chat window in order
- [ ] Click "Publish" — modal shows shareable URL
- [ ] Open URL in incognito — chatbot works without login
