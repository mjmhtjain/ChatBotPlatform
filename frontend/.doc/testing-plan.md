# Frontend Testing Plan

## Stack

| Tool | Role |
|------|------|
| **Vitest** | Test runner — Vite-native, shares `vite.config.ts` |
| **React Testing Library (RTL)** | Component rendering and DOM querying |
| **jsdom** | Fake browser DOM for Vitest (runs in Node) |
| **MSW (Mock Service Worker)** | Intercepts HTTP at the network level — shared across unit and E2E |
| **Playwright** | End-to-end tests in a real browser |

---

## Test Layers

### Layer 1 — Unit / Component Tests

Location: `src/**/*.test.tsx` (co-located with the source file)

Fast. Run on every save. Test one component or function in isolation. HTTP calls are mocked at the module level (`vi.mock('../lib/api')`).

| File | What is tested |
|------|----------------|
| `src/pages/LoginPage.tsx` | Renders inputs and button; spinner + disabled button while submitting; navigates to `/projects` on success; shows error on bad credentials |
| `src/App.tsx` | `/login` renders LoginPage; `*` redirects to `/login`; `/projects` renders ProjectsPage |

As the app grows, add tests for:
- `src/components/flow/FlowCanvas.tsx` — nodes render, edges connect
- `src/store/authStore.ts` — token set / clear / refresh logic
- `src/lib/api.ts` — 401 interceptor triggers token refresh, then retries

---

### Layer 2 — Integration Tests

Location: `tests/integration/*.test.tsx`

Slower. Test a full feature across multiple components, real routing, and real stores.
HTTP is intercepted by MSW — tests the actual `api.ts` code, not mocks of it.

| File | What to test |
|------|-------------|
| `login-flow.test.tsx` | Form submit → POST /api/auth/login → token stored → redirect to /projects |
| `login-flow.test.tsx` | Wrong password → error message displayed |
| `token-refresh.test.tsx` | Expired token → 401 → interceptor calls POST /api/auth/refresh → retries |
| `project-crud.test.tsx` | Create project → POST /api/projects → card appears in list |
| `project-crud.test.tsx` | Delete project → DELETE /api/projects/:id → card removed |

---

### Layer 3 — End-to-End Tests (Playwright)

Location: `tests/e2e/*.spec.ts`

Slowest. Run against the real Docker container. Catch CSS visibility bugs, browser quirks, and Docker networking issues.

| File | What to test |
|------|-------------|
| `login.spec.ts` | Correct credentials → lands on /projects |
| `login.spec.ts` | Wrong password → error message visible |
| `projects.spec.ts` | Create, rename, and delete a project |
| `flow-builder.spec.ts` | Open project → flow canvas loads → add a Say node |
| `flow-builder.spec.ts` | Publish flow → shareable URL appears and responds |

---

## Folder Structure

```
frontend/
  src/
    pages/
      LoginPage.tsx
      LoginPage.test.tsx          <- unit tests co-located
    components/
      flow/
        FlowCanvas.tsx
        FlowCanvas.test.tsx
    store/
      authStore.ts
      authStore.test.ts
    lib/
      api.ts
      api.test.ts
  tests/
    integration/
      login-flow.test.tsx
      project-crud.test.tsx
      token-refresh.test.tsx
    e2e/
      login.spec.ts
      projects.spec.ts
      flow-builder.spec.ts
    mocks/
      handlers.ts                 <- MSW request handlers (shared across all layers)
      server.ts                   <- MSW Node server (used in Vitest)
      browser.ts                  <- MSW browser worker (used in Playwright)
```

---

## TODO

- [x] Install Vitest, RTL, jsdom
- [x] Configure Vitest in `vite.config.ts`
- [x] Add `npm run test` and `npm run test:watch` scripts to `package.json`
- [x] Write unit tests for `LoginPage`
- [x] Write unit tests for `App` router
- [ ] Set up MSW handlers for `/api/auth/login` and `/api/auth/refresh`
- [ ] Write integration test for login flow
- [ ] Install and configure Playwright
- [ ] Write E2E smoke test for login
- [ ] Add test run to CI (GitHub Actions) — run on every PR
