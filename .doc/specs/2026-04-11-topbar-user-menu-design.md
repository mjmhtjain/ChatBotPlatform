# Topbar & User Menu — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

## Overview

Add a persistent top navigation bar to all authenticated pages. The bar includes a brand name on the left and a circular user avatar on the right. Clicking the avatar opens a dropdown with Profile and Logout actions.

## Visual Design

- **Style:** Dark slate (`#1e293b` background, `#f1f5f9` text)
- **Height:** 56px, full width
- **Left:** Brand name "💬 ChatBot Platform"
- **Right:** 36×36px circular avatar, slate background (`#334155`), muted border (`#475569`)

## Avatar

Initials are derived from the `access_token` stored in `localStorage`:

1. Base64-decode the JWT payload (middle segment)
2. Parse JSON, read the `email` claim
3. Split on `@`, take the local part (e.g. `mjmhtjain`)
4. Split on non-alphanumeric characters, take first letter of each word, uppercase, max 2 characters
5. If decoding fails for any reason, fall back to a generic person icon (SVG)

No API call is made. No user profile data is fetched.

## Dropdown Menu

Opens on avatar click. Closes when the user clicks anywhere outside the menu (click-outside handler via `useEffect` + `ref`).

| Item | Action |
|------|--------|
| **Profile** | `navigate('/profile')` — page does not exist yet, navigation is a stub |
| **Logout** | `localStorage.removeItem('access_token')` then `navigate('/login')` |

The dropdown header shows the full email address (truncated with ellipsis if long) as a non-interactive label.

Logout item is styled in red (`#ef4444`) to signal a destructive action.

## Component Architecture

```
src/
  components/
    layout/
      TopBar.tsx      — topbar UI + dropdown logic
      Layout.tsx      — shell: <TopBar /> above {children}
  lib/
    auth.ts           — getInitials(token: string): string  (JWT decode util)
```

### `Layout.tsx`

Renders `<TopBar />` followed by `<main>{children}</main>`. No state. Pure structural wrapper.

### `TopBar.tsx`

- Reads `access_token` from `localStorage` on mount, derives initials via `getInitials`
- `showMenu` boolean state controls dropdown visibility
- `useEffect` adds a `mousedown` listener to `document` to close the dropdown on outside click; cleans up on unmount
- Avatar button toggles `showMenu`

### `auth.ts` (addition to existing `src/lib/`)

```ts
export function getInitials(token: string): string
```

Decodes the JWT payload, extracts `email`, returns 1–2 uppercase initials. Returns `'?'` on any decode error.

## Route Wiring (`App.tsx`)

Authenticated routes are wrapped with `<Layout>`. The login route is **not** wrapped.

```tsx
// Before
<Route path="/projects" element={<ProjectsPage />} />

// After
<Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
```

As new authenticated pages are added (e.g. `/profile`), they are wrapped the same way.

## Out of Scope

- Profile page implementation (future)
- Fetching user data from an API
- Token refresh or session expiry handling
- Mobile-responsive hamburger menu

## Testing

- **`auth.ts`** — unit test `getInitials` with valid JWT, malformed token, and missing email claim
- **`TopBar.tsx`** — renders initials, dropdown opens on avatar click, closes on outside click, logout clears token and navigates
- **`Layout.tsx`** — renders TopBar and children
