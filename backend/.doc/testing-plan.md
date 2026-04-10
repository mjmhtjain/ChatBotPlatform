# Backend Testing Plan

## Stack

| Tool | Role |
|------|------|
| **`go test`** | Built-in Go test runner |
| **`net/http/httptest`** | In-process HTTP server for handler tests — no real network |
| **`testify`** (future) | Richer assertions when the test suite grows |

Run all tests:

```sh
cd backend
go test ./...
```

---

## Test Layers

### Layer 1 — Unit Tests (services)

Location: `internal/services/*_test.go`

Test pure business logic with no HTTP or I/O involved.

| File | What is tested |
|------|----------------|
| `services/auth_test.go` | `ValidateCredentials`: correct creds pass; wrong email, wrong password, both wrong, and empty all return an error |
| `services/auth_test.go` | `GenerateToken`: returns a non-empty JWT signed with the correct secret; rejected when verified with a different secret |

---

### Layer 2 — Handler Tests

Location: `internal/handlers/*_test.go`

Test HTTP handlers using `httptest.NewRecorder()` and a real Gin router in `gin.TestMode`. No network, no Docker — just in-process request/response.

| File | What is tested |
|------|----------------|
| `handlers/auth_test.go` | `POST /api/auth/login` with valid credentials → 200 + `access_token` |
| `handlers/auth_test.go` | Wrong password or wrong email → 401 |
| `handlers/auth_test.go` | Missing email or password field → 400 |
| `handlers/auth_test.go` | Malformed JSON body → 400 |

---

### Layer 3 — Integration Tests (planned)

Location: `tests/integration/`

Test the full request path including middleware (CORS, JWT auth) and multiple handlers working together. Will use an in-process server started with `httptest.NewServer`.

| Scenario | What to test |
|----------|-------------|
| Login → use token → call protected route | Token accepted by JWT middleware |
| Expired / tampered token → protected route | 401 returned |
| CORS preflight | OPTIONS returns correct headers |

---

## Folder Structure

```
backend/
  internal/
    services/
      auth.go
      auth_test.go          <- unit tests co-located
    handlers/
      auth.go
      auth_test.go          <- handler tests co-located
  tests/
    integration/            <- planned
```

---

## TODO

- [x] Write unit tests for `AuthService`
- [x] Write handler tests for `POST /api/auth/login`
- [ ] Write integration test: login → access protected route with token
- [ ] Write integration test: expired token → 401
- [ ] Add `go test ./...` to CI (GitHub Actions) — run on every PR
