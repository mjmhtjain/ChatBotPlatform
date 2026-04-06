# ChatBot Platform

A web application for building, testing, and publishing chatbot flows.

## Status

| Component | Status |
|-----------|--------|
| Frontend (login page) | Done |
| Backend (Go + Gin) | Planned |
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
cp .env.example .env
```

The defaults in `.env.example` work for local development. No changes needed to run the frontend.

### 3. Start the frontend

```sh
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will see the login page.

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

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_PORT` | `3000` | Port the frontend is served on |
| `BACKEND_PORT` | `8080` | Port the backend API listens on (not yet built) |
| `POSTGRES_DB` | `chatbot` | PostgreSQL database name |
| `POSTGRES_USER` | `chatbot` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `chatbot` | PostgreSQL password |
| `JWT_SECRET` | — | Secret for signing JWT tokens |
| `ADMIN_EMAIL` | `admin@example.com` | Seeded admin user email |
| `ADMIN_PASSWORD` | `admin123` | Seeded admin user password |
| `ADMIN_NAME` | `Admin` | Seeded admin user display name |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API URL used by the frontend |

---

## Project Structure

```
ChatBotPlatform/
  docker-compose.yml      # Service orchestration
  .env.example            # Environment variable template
  frontend/               # React + TypeScript + Vite app (served by nginx)
  backend/                # Go + Gin API (coming soon)
```

---

## Development Plan

See [PLAN.md](PLAN.md) for the full architecture, data models, API design, and phased implementation roadmap.
