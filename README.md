# LendingPad — UI Engineer Assessment

A financial dashboard SPA built with **Vite + TypeScript + SCSS** — no UI framework, no state management library. Every interaction from the hash-based router to the animated edit drawer is written from scratch in ~800 lines of source TypeScript.

---

## Quick Start

```bash
# Requires Node 18+ and Yarn 4 (enable via: corepack enable)

yarn               # install dependencies
yarn dev:all       # starts Vite (localhost:5173) + JSON API (localhost:3001) concurrently
```

| Script | Purpose |
|--------|---------|
| `yarn dev` | Vite dev server only |
| `yarn api` | JSON Server mock API only |
| `yarn dev:all` | Both concurrently |
| `yarn test` | Vitest watch mode |
| `yarn test:coverage` | Coverage report → `coverage/` |
| `yarn build` | TypeScript check + Vite production build |

---

## Project Structure

```
src/
├── main.ts                   # Entry point — routes + global click handler
├── router.ts                 # Hash-based SPA router (~35 lines)
├── api.ts                    # Typed fetch wrappers (getRecords, getRecord, updateRecord)
├── paginator.ts              # Headless paginator controller
├── components/
│   ├── drawer.ts             # Edit drawer HTML template (two-panel)
│   └── row.ts                # Table row HTML template
├── utils/
│   ├── diff.ts               # buildDiff() — changed vs unchanged field comparison
│   ├── format.ts             # fmt() currency formatter, cap() capitalizer
│   ├── sort.ts               # sortBy() — immutable, locale-aware sort
│   └── toast.ts              # showToast() — accessible live-region notification
├── views/
│   └── dashboard.ts          # Module state + orchestration
└── scss/
    ├── main.scss             # Entry — @use imports
    ├── _variables.scss       # Design tokens
    ├── _base.scss            # Reset + global defaults
    ├── _icons.scss           # @font-face + icon classes
    ├── _components.scss      # All component styles
    └── _layout.scss          # Dashboard layout + responsive
```

---

## Design Highlights

### Edit Drawer — Modern Focused UX

The edit flow lives in a right-side drawer rather than a separate page, keeping the user contextually anchored to the data they are editing.

**Focus without isolation** — a translucent backdrop (`rgba(0,0,0,0.35)`) draws the eye to the drawer while leaving ~60px of the table visible at the right edge. Users retain awareness of which row they are editing without a full context switch.

**Two-panel confirmation flow** — clicking Confirm does not immediately save. Instead the drawer slides to a second panel that renders a **visual diff** of the changes:

- Fields that changed show the old value in red with strikethrough → new value in green bold
- Unchanged fields are listed below in muted gray
- A summary line ("3 fields changed") gives instant orientation

This mirrors the mental model of a git diff: the user can verify their intent before committing the write. It catches misinputs before they reach the API.

**Skeleton loading state** — when the drawer opens, a shimmer skeleton matching the height and rhythm of the form fields appears immediately while the record fetches. The form and Confirm button are hidden and disabled until data arrives, preventing interaction with stale state.

### Search

The toolbar search filters all six text fields (`name`, `email`, `accountId`, `description`, `status`, `phone`) in real time, case-insensitively. The paginator total updates on every keystroke. No-match results show a contextual empty state that echoes the search term back so the user knows what was tried.

### Responsive Design

Three breakpoints drive layout across device classes:

| Variable | Value | Behaviour |
|----------|-------|-----------|
| `$bp-tablet` | 768px | Table gains `min-width: 860px` and scrolls horizontally; toolbar padding reduces |
| `$bp-mobile` | 480px | Toolbar stacks vertically; drawer goes full-width; search expands to fill; toast anchors left+right |

The table is never crushed — it scrolls inside `.dashboard__table-scroll` at narrow viewports so column data stays readable.

---

## Technical Highlights

### Zero-Dependency SPA

There is no React, Vue, or router library. The hash-based router (`src/router.ts`) is ~35 lines:

```ts
register(/^\/$/, { render: dashboardRender, mount: dashboardMount })

window.addEventListener('hashchange', dispatch)
document.addEventListener('DOMContentLoaded', dispatch)
```

`render()` returns an HTML string; `mount()` wires up all event listeners. This pattern demonstrates understanding of what frameworks do under the hood.

### Module-Level State

`dashboard.ts` owns all mutable state at module scope — no prop drilling, no global object, no store library:

```ts
let sortKey:               keyof LoanRecord | null = 'id'
let sortDir:               SortDir = 'asc'
let cachedRecords:         LoanRecord[] = []
let searchQuery:           string = ''
let currentPage:           number = 1
let rowsPerPage:           number = 10
let currentDrawerRecordId: number | null = null
let currentDrawerRecord:   LoanRecord | null = null
let pendingUpdate:         Partial<LoanRecord> | null = null
```

State survives route changes because the module is only evaluated once. After a successful save, `getRecords()` is re-fetched rather than patching the cache manually — the server is the source of truth.

### SCSS Architecture

**BEM throughout** — every class follows Block–Element–Modifier: `data-table__cell--sorted-asc`, `drawer__panels-track--step-2`, `diff-row--changed`. Modifiers are applied exclusively by JavaScript toggling a single class, keeping styling concerns in CSS and behavior in TypeScript.

**`@use` module system** — the modern SCSS module system (`@use`) replaces the deprecated `@import`. Each partial declares its own dependencies explicitly; no global namespace leakage.

**Design tokens** — all color, radius, font, and breakpoint decisions live in `_variables.scss` with semantic aliases:

```scss
$color-text-negative: $color-due;   // red, reused for negative balances
$color-bg-main:       #F5F7FA;      // page background
```

### Animations

Five distinct motion contexts, all using `cubic-bezier(0.4, 0, 0.2, 1)` (Material's standard easing):

| Animation | Implementation |
|-----------|---------------|
| Drawer open/close | `transform: translateX(100% → 0)`, 300ms |
| Panel-to-panel swipe | `transform: translateX(0 → -50%)` on a 200%-wide flex track, 300ms |
| Backdrop fade | `opacity: 0 → 1`, 300ms |
| Toast slide-up | `transform: translateY(0.75rem → 0)` + `opacity`, 250ms |
| Skeleton shimmer | `background-position` sweep, 1.4s infinite loop |

All transitions are suppressed for users who have enabled **Reduce Motion** in their OS settings:

```scss
@media (prefers-reduced-motion: reduce) {
  .drawer, .drawer__panels-track, .drawer-backdrop, .toast { transition: none; }
  .skel-label, .skel-input { animation: none; }
}
```

### Custom Icon Font

Ten glyphs served as a single `DashboardIcons.woff` file via `@font-face`. Icons are rendered with `<i class="icon-pencil" aria-hidden="true">` — the `aria-hidden` attribute keeps them invisible to screen readers; descriptive labels live on the parent button instead.

| Class | Description |
|-------|-------------|
| `icon-add` | Add user |
| `icon-search` | Search |
| `icon-filter` | Filter |
| `icon-pencil` | Edit row |
| `icon-actions` | Actions menu trigger |
| `icon-invite` | Invite consumer |
| `icon-email` | Send email |
| `icon-cost` | Manage cost details |
| `icon-up-sort` | Sort ascending indicator |
| `icon-down-sort` | Sort descending indicator |

### Accessibility

- **Drawer:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to the visible title
- **Toast:** `role="status"` + `aria-live="polite"` — screen readers announce saves and errors without interrupting the user
- **Keyboard:** Escape closes the drawer from anywhere on the page; focus moves to the first form field after the record loads
- **Icon buttons:** all icon-only buttons carry `aria-label`; required field markers use `aria-label="required"`
- **Reduced motion:** OS-level preference respected via `prefers-reduced-motion`

### TypeScript

Strict compiler flags beyond `"strict": true`:

```json
"noUnusedLocals":      true,
"noUnusedParameters":  true,
"verbatimModuleSyntax": true,
"erasableSyntaxOnly":  true
```

`verbatimModuleSyntax` enforces `import type` for type-only imports, keeping the emitted JS clean. `erasableSyntaxOnly` bans syntax that requires a TypeScript transform (enums, namespaces) in favor of plain ESNext.

### UX Micro-Interactions

- **Save button disabled** during the in-flight `updateRecord` request — prevents double-submit
- **Confirm button disabled** while the drawer skeleton is loading — prevents interacting with unpopulated state
- **Action dropdown smart positioning** — flips upward when the trigger is near the bottom of the viewport
- **Inline validation** — required fields turn red on the specific inputs that failed, not a generic banner
- **`overscroll-behavior: contain`** on the drawer body — scroll inside the drawer does not chain to the page behind it

---

## Test Coverage

88 unit tests across 5 test files using **Vitest + jsdom**:

| File | What it covers |
|------|----------------|
| `api.test.ts` | fetch wrappers, error cases |
| `router.test.ts` | route registration, dispatch, named capture groups |
| `paginator.test.ts` | pagination math, button states, rows-per-page, `updateTotal` |
| `utils/sort.test.ts` | numeric/string sort, immutability, edge cases |
| `views/dashboard.test.ts` | render, sort, dropdowns, drawer open/close/save, skeleton states, search filter |

```
Statements : 97.22%
Branches   : 84.42%
Functions  : 100%
Lines      : 98.84%
```

Tests cover async edge cases with fake timers (`vi.useFakeTimers`) for the toast auto-dismiss sequence, mocked fetch for API failure paths, and keyboard events for Escape-to-close.
