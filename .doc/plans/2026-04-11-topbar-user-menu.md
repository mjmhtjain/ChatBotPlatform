# Topbar & User Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent dark slate top navigation bar to all authenticated pages, with a circular avatar that shows a dropdown menu for Profile navigation and Logout.

**Architecture:** A shared `Layout` component wraps all authenticated routes in `App.tsx`, rendering `TopBar` above its children. `TopBar` reads the JWT from `localStorage`, decodes the email claim client-side to derive initials, and manages a click-toggled dropdown that closes on outside click. Logout clears the token and redirects to `/login`.

**Tech Stack:** React 18, TypeScript, Tailwind v4, React Router v6, Vitest + Testing Library

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/lib/auth.ts` | `getInitials(token)` — JWT decode, email → initials |
| Create | `frontend/src/lib/auth.test.ts` | Unit tests for `getInitials` |
| Create | `frontend/src/components/layout/TopBar.tsx` | Topbar UI + dropdown open/close logic |
| Create | `frontend/src/components/layout/TopBar.test.tsx` | Topbar render + interaction tests |
| Create | `frontend/src/components/layout/Layout.tsx` | Structural shell: TopBar + children |
| Create | `frontend/src/components/layout/Layout.test.tsx` | Layout renders TopBar and children |
| Modify | `frontend/src/App.tsx` | Wrap `/projects` route with `<Layout>` |
| Modify | `frontend/src/App.test.tsx` | Update route test to account for Layout wrapper |

---

## Task 1: `getInitials` utility in `src/lib/auth.ts`

**Files:**
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/lib/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getInitials } from './auth'

// Helper: build a minimal fake JWT with the given payload
function makeToken(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
  return `header.${encoded}.signature`
}

describe('getInitials', () => {
  it('returns two uppercase initials from a plain email local part', () => {
    const token = makeToken({ email: 'mjmhtjain@example.com' })
    expect(getInitials(token)).toBe('MJ')
  })

  it('returns one initial when the local part has one segment', () => {
    const token = makeToken({ email: 'alice@example.com' })
    expect(getInitials(token)).toBe('A')
  })

  it('returns two initials for a dotted local part', () => {
    const token = makeToken({ email: 'john.doe@example.com' })
    expect(getInitials(token)).toBe('JD')
  })

  it('returns ? for a malformed token', () => {
    expect(getInitials('not.a.jwt')).toBe('?')
  })

  it('returns ? when the email claim is missing', () => {
    const token = makeToken({ sub: 'user-123' })
    expect(getInitials(token)).toBe('?')
  })

  it('returns ? for an empty string', () => {
    expect(getInitials('')).toBe('?')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- auth.test
```

Expected: 6 failures — `getInitials` is not defined.

- [ ] **Step 3: Implement `getInitials`**

Create `frontend/src/lib/auth.ts`:

```ts
/**
 * Decodes a JWT (without verifying signature) and derives 1-2 uppercase
 * initials from the email claim in the payload.
 * Returns '?' if decoding fails or the email claim is absent.
 */
export function getInitials(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const email: string = payload.email
    if (!email) return '?'
    const local = email.split('@')[0]
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
    return parts
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('')
  } catch {
    return '?'
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- auth.test
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/auth.ts frontend/src/lib/auth.test.ts
git commit -m "feat: add getInitials JWT utility"
```

---

## Task 2: `TopBar` component

**Files:**
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/TopBar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/layout/TopBar.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TopBar from './TopBar'

// Mock getInitials so tests don't depend on real JWT decoding
vi.mock('../../lib/auth', () => ({
  getInitials: vi.fn(() => 'MJ'),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.setItem('access_token', 'fake.token.here')
})

afterEach(() => {
  localStorage.clear()
  mockNavigate.mockReset()
})

describe('TopBar', () => {
  it('renders the brand name', () => {
    renderTopBar()
    expect(screen.getByText(/chatbot platform/i)).toBeInTheDocument()
  })

  it('renders the avatar with initials', () => {
    renderTopBar()
    expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('MJ')
  })

  it('dropdown is hidden by default', () => {
    renderTopBar()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the dropdown when avatar is clicked', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('logout clears access_token and navigates to /login', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /logout/i }))
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('profile item navigates to /profile', async () => {
    const user = userEvent.setup()
    renderTopBar()
    await user.click(screen.getByRole('button', { name: /user menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /profile/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- TopBar.test
```

Expected: failures — `TopBar` module not found.

- [ ] **Step 3: Implement `TopBar`**

Create `frontend/src/components/layout/TopBar.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '../../lib/auth'

export default function TopBar() {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = getInitials(localStorage.getItem('access_token') ?? '')

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showMenu])

  function handleLogout() {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-slate-700">
      <span className="text-sm font-semibold text-slate-100 tracking-tight">
        💬 ChatBot Platform
      </span>

      <div className="relative" ref={menuRef}>
        <button
          aria-label="User menu"
          onClick={() => setShowMenu(v => !v)}
          className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-xs font-semibold flex items-center justify-center hover:bg-slate-600 transition-colors"
        >
          {initials}
        </button>

        {showMenu && (
          <div
            role="menu"
            className="absolute right-0 top-11 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <button
              role="menuitem"
              aria-label="Profile"
              onClick={() => { setShowMenu(false); navigate('/profile') }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.121 17.804A9 9 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile
            </button>
            <button
              role="menuitem"
              aria-label="Logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- TopBar.test
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/TopBar.tsx frontend/src/components/layout/TopBar.test.tsx
git commit -m "feat: add TopBar component with user menu dropdown"
```

---

## Task 3: `Layout` component

**Files:**
- Create: `frontend/src/components/layout/Layout.tsx`
- Create: `frontend/src/components/layout/Layout.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/layout/Layout.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

// Stub TopBar — layout tests don't need to re-test topbar behaviour
vi.mock('./TopBar', () => ({
  default: () => <div data-testid="topbar" />,
}))

function renderLayout(children: React.ReactNode) {
  return render(
    <MemoryRouter>
      <Layout>{children}</Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders the TopBar', () => {
    renderLayout(<p>content</p>)
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('renders its children', () => {
    renderLayout(<p>hello world</p>)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- Layout.test
```

Expected: failures — `Layout` module not found.

- [ ] **Step 3: Implement `Layout`**

Create `frontend/src/components/layout/Layout.tsx`:

```tsx
import TopBar from './TopBar'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- Layout.test
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Layout.tsx frontend/src/components/layout/Layout.test.tsx
git commit -m "feat: add Layout shell component"
```

---

## Task 4: Wire `Layout` into `App.tsx` and update `ProjectsPage`

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/ProjectsPage.tsx`
- Modify: `frontend/src/App.test.tsx` (if it exists)

- [ ] **Step 1: Update `App.tsx`**

Replace the contents of `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import Layout from './components/layout/Layout'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Remove `min-h-screen` from `ProjectsPage` outer div**

`Layout` now owns the full-height wrapper. Open `frontend/src/pages/ProjectsPage.tsx` and change the outermost div on line 58 from:

```tsx
<div className="min-h-screen bg-gray-50">
```

to:

```tsx
<div className="bg-gray-50 flex-1">
```

Also update the loading state div on line 51 from:

```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
```

to:

```tsx
<div className="flex-1 bg-gray-50 flex items-center justify-center">
```

- [ ] **Step 3: Run the full test suite**

```bash
cd frontend && npm test
```

Expected: all tests pass. If `App.test.tsx` fails because it doesn't expect `TopBar` to render, add a mock:

```tsx
vi.mock('./components/layout/TopBar', () => ({
  default: () => <div data-testid="topbar" />,
}))
```

at the top of `frontend/src/App.test.tsx` alongside the other mocks.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/ProjectsPage.tsx frontend/src/App.test.tsx
git commit -m "feat: wire Layout into App routes, remove redundant min-h-screen from ProjectsPage"
```

---

## Task 5: Smoke-test in the browser

- [ ] **Step 1: Rebuild and verify**

The Docker Compose setup serves a production build. Rebuild the frontend image and restart:

```bash
docker compose build frontend && docker compose up -d
```

- [ ] **Step 2: Log in and verify topbar appears**

Open `http://localhost:3000`, log in with credentials from `backend/.env`. You should see:
- Dark slate topbar across the top
- Avatar button on the right showing initials
- Clicking the avatar opens a dropdown with Profile and Logout
- Clicking Logout clears the session and returns to the login page
- Clicking Profile navigates to `/profile` (will show a blank/redirect — expected, page not implemented yet)

- [ ] **Step 3: Commit .gitignore update (if needed)**

If `.superpowers/` is not already in `.gitignore`, add it:

```bash
echo '.superpowers/' >> .gitignore
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```
