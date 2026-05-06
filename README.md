# ChatBot Platform

A web application for building, testing, and publishing chatbot flows.

## Status

| Phase | Status |
|-------|--------|
| Auth (login + JWT) | ✅ Done |
| Projects CRUD | ✅ Done |
| Flow Builder (React Flow canvas, JSONB persistence) | ✅ Done |
| Integration Tests (Pact contract + Playwright E2E) | ✅ Done |
| Additional Node Types & Endpoint Tab | 🔜 Planned |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

---

## Running the Application

### 1. Clone the repo

```sh
git clone https://github.com/mjmhtjain/ChatBotPlatform.git
cd ChatBotPlatform
```

### 2. Set up environment variables

```sh
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials. The defaults work for local development.

### 3. Start the application

```sh
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Log in with the credentials from `backend/.env`.

To run in the background:

```sh
docker compose up --build -d
```

To stop:

```sh
docker compose down
```

---

## Environment Variables

All backend config lives in `backend/.env` (gitignored). Use `backend/.env.example` as the template.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the backend API listens on | `8080` |
| `ADMIN_EMAIL` | Admin user email for login | `user@gmail.com` |
| `ADMIN_PASSWORD` | Admin user password for login | `password` |
| `JWT_SECRET` | Secret for signing JWT tokens | `dev-secret-change-in-prod` |
| `CORS_ORIGIN` | Allowed CORS origin for the frontend | `http://localhost:3000` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_USER` | PostgreSQL user | `chatbot` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `chatbot` |
| `POSTGRES_DB` | PostgreSQL database name | `chatbot` |

---

## Project Structure

```
ChatBotPlatform/
  docker-compose.yml
  backend/                    # Go + Gin API
    .env.example
    .env                      # local only, gitignored
    Dockerfile
    cmd/main.go               # entry point
    internal/
      config/                 # env var loading
      database/               # GORM + PostgreSQL connection, AutoMigrate
      handlers/               # HTTP handlers + consumer-side interfaces
      middleware/             # CORS, JWT auth
      models/                 # Project, Flow structs
      router/                 # route registration
      services/               # business logic (auth, projects, flows)
    tests/pact/               # Pact provider verification tests
  frontend/                   # React + TypeScript + Vite (served by nginx)
    Dockerfile
    src/
      pages/                  # LoginPage, ProjectsPage, ProjectDetailPage, FlowEditorPage
      components/             # layout, projects, flows, flow-editor
      lib/                    # Axios instance, JWT helpers
      types/                  # shared TypeScript types
  integration/                # Contract + E2E tests (isolated Docker stack)
    Makefile                  # make test / test-pact / test-e2e
    docker-compose.test.yml   # test stack on ports 5433/8081/3001
    pact/consumer/            # TypeScript Pact consumer tests
    pact/pacts/               # committed contract JSON
    e2e/                      # Playwright specs
```

---

## Running Tests

### Frontend unit tests

```sh
cd frontend
npm test
```

### Backend unit tests

```sh
cd backend
go test ./...
```

### Integration tests (Pact + Playwright)

See **[integration/README.md](integration/README.md)** for full setup and usage. Quick start:

```sh
cd integration
npm install
make test        # runs Pact contract tests then Playwright E2E
```

Individual layers:

```sh
make test-pact   # contract tests only (Pact consumer + provider)
make test-e2e    # Playwright E2E only (spins up Docker test stack)
```
