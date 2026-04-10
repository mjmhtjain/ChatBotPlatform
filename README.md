# ChatBot Platform

A web application for building, testing, and publishing chatbot flows.

## Status

| Component | Status |
|-----------|--------|
| Frontend (login page) | Done |
| Backend (Go + Gin, login endpoint) | Done |
| Database (PostgreSQL) | Planned |

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

| Variable | Description |
|----------|-------------|
| `PORT` | Port the backend API listens on (default: `8080`) |
| `ADMIN_EMAIL` | Admin user email for login |
| `ADMIN_PASSWORD` | Admin user password for login |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `FRONTEND_PORT` | Port the frontend is served on (default: `3000`) |
| `BACKEND_PORT` | Port the backend is exposed on (default: `8080`) |

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
      handlers/               # HTTP handlers
      middleware/             # CORS
      router/                 # route registration
      services/               # business logic (auth, JWT)
  frontend/                   # React + TypeScript + Vite (served by nginx)
    .doc/                     # frontend-specific docs
    Dockerfile
    src/
      pages/
      lib/
      store/
```

---

## Running Tests

### Frontend

```sh
cd frontend
npm test
```

### Backend

```sh
cd backend
go test ./...
```

---

## Development Plan

See [.doc/PLAN.md](.doc/PLAN.md) for the full architecture, data models, API design, and phased implementation roadmap.
