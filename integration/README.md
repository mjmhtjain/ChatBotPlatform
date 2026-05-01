# Integration Tests

This directory contains two layers of automated integration tests for ChatBotPlatform:

| Layer | Tool | What it tests |
|-------|------|---------------|
| **Contract (Pact)** | Vitest + pact-go | API contract between frontend and backend |
| **E2E (Playwright)** | Playwright | Full user journeys in a real browser |

Both layers run against an isolated Docker stack (separate ports from dev) so they never touch your local database.

---

## Prerequisites

| Dependency | Minimum version | Install |
|------------|----------------|---------|
| Docker + Docker Compose | Docker ≥ 24 | https://docs.docker.com/get-docker/ |
| Node.js | ≥ 18 | https://nodejs.org |
| Go | ≥ 1.24 | https://go.dev/dl/ |
| CGO toolchain | (GCC or Clang) | Required by pact-go for Rust FFI |

> **macOS:** Xcode Command Line Tools provide the CGO toolchain — run `xcode-select --install` if you haven't already.  
> **Linux:** Install `gcc` via your package manager (`apt install build-essential`, `yum groupinstall "Development Tools"`, etc.).

### Install Node dependencies

```sh
cd integration
npm install
```

### Install Playwright browsers (first time only)

```sh
npx playwright install --with-deps chromium
```

---

## Running All Tests

From the `integration/` directory:

```sh
make test
```

This runs Pact contract tests first, then Playwright E2E tests. The entire suite uses a dedicated Docker stack on isolated ports and tears it down automatically when finished.

---

## Running Individual Layers

### Pact Contract Tests Only

```sh
make test-pact
```

**What this does:**

1. Runs the TypeScript consumer tests (`pact/consumer/api.pact.test.ts`) against a Pact mock server — no real backend needed
2. Generates / updates `pact/pacts/frontend-backend.json` (the committed contract file)
3. Starts a `postgres-test` container on port **5433**
4. Runs the Go provider tests (`../backend/tests/pact/`) against a real backend + real Postgres to verify the contract
5. Stops the `postgres-test` container

> The provider tests require `CGO_ENABLED=1` (set automatically by the Makefile) because pact-go uses a Rust FFI library.

**Run consumer tests alone** (no Docker, generates the JSON contract):

```sh
npm run test:pact:consumer
```

### Playwright E2E Tests Only

```sh
make test-e2e
```

**What this does:**

1. Starts the full test stack (`postgres-test`, `backend-test`, `frontend-test`) via `docker-compose.test.yml`
2. Waits for the frontend to be reachable at `http://localhost:3001` and the backend at `http://localhost:8081`
3. Runs all specs in `e2e/` against the live stack
4. Tears the stack down when finished

**Run Playwright interactively** (requires the test stack to already be up):

```sh
# Terminal 1 — start the test stack
docker compose -f docker-compose.test.yml up

# Terminal 2 — run tests in headed mode
npx playwright test e2e/ --headed

# Or open Playwright UI
npx playwright test e2e/ --ui
```

---

## Test Stack Ports

The test stack runs on different ports from the dev stack to avoid conflicts:

| Service | Dev port | Test port |
|---------|----------|-----------|
| PostgreSQL | 5432 | **5433** |
| Backend API | 8080 | **8081** |
| Frontend | 3000 | **3001** |

Test credentials (hardcoded in `docker-compose.test.yml`):

| Field | Value |
|-------|-------|
| Email | `user@gmail.com` |
| Password | `password` |

---

## What the Tests Cover

### Pact Consumer Interactions (`pact/consumer/api.pact.test.ts`)

| Endpoint | Scenario |
|----------|----------|
| `POST /api/auth/login` | Valid credentials → 200 + `access_token` |
| `POST /api/auth/login` | Wrong password → 401 |
| `GET /api/projects` | Authenticated → 200 + `[]` when no projects |
| `POST /api/projects` | Create → 201 + project object |
| `PATCH /api/projects/:id` | Rename → 200 + updated project |
| `DELETE /api/projects/:id` | Delete → 204 |

### Playwright E2E Specs

**`e2e/login.spec.ts`** — 3 tests:
- Valid credentials → navigates to `/projects`
- Wrong password → error message displayed
- No token → redirected to `/login`

**`e2e/projects.spec.ts`** — 4 tests (each starts with a fresh login):
- Create project → card appears in list
- Rename project → card shows new name
- Delete project → card removed from list
- Projects page → heading is visible

---

## Viewing Test Reports

### Playwright HTML Report

After a test run, open the report:

```sh
npx playwright show-report
```

The report is saved to `playwright-report/` (gitignored).

### Pact Contract File

The generated contract lives at `pact/pacts/frontend-backend.json` and is committed to the repo. It is the source of truth for the API contract — consumer tests regenerate it, provider tests verify it.

---

## Troubleshooting

### `CGO_ENABLED` error when running Pact provider tests

```
cgo: C compiler "gcc" not found
```

Install a C compiler (see Prerequisites above). On macOS: `xcode-select --install`.

### Port already in use

```
Error: bind: address already in use
```

Stop the dev stack or any other services using the conflicting port:

```sh
# Stop the dev stack
docker compose down

# Or find and kill the process
lsof -ti:5433 | xargs kill -9
```

### Playwright browsers not installed

```
Error: browserType.launch: Executable doesn't exist
```

Install browsers:

```sh
npx playwright install --with-deps chromium
```

### Test stack containers not healthy

If `make test-e2e` hangs waiting for the stack, check container logs:

```sh
docker compose -f docker-compose.test.yml logs backend-test
docker compose -f docker-compose.test.yml logs postgres-test
```

To manually tear down a stuck stack:

```sh
docker compose -f docker-compose.test.yml down -v
```

---

## Directory Structure

```
integration/
  Makefile                        # make test / test-pact / test-e2e
  docker-compose.test.yml         # isolated test stack (ports 5433/8081/3001)
  package.json                    # Node deps: pact, playwright, vitest
  playwright.config.ts            # baseURL: http://localhost:3001
  vitest.config.ts                # include: pact/consumer/**/*.test.ts
  pact/
    consumer/
      api.pact.test.ts            # 6 consumer interactions (TypeScript/Vitest)
    pacts/
      frontend-backend.json       # committed contract file (living spec)
  e2e/
    login.spec.ts                 # 3 login E2E tests
    projects.spec.ts              # 4 projects CRUD E2E tests
```

The backend Pact provider tests live in `../backend/tests/pact/provider_test.go`.
