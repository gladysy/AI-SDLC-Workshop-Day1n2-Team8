# Todo App Implementation Plan — All 11 Use Cases

## Context

A partial scaffold has been merged into main (commit d12ec10): Next.js project structure, Todo CRUD with priority, auth stub (single default user), and basic page.tsx (~500 lines with inline components). The task is to implement the remaining 9 use cases defined in `PRPs/`, modularize page.tsx into separate components, and complete all 11 use cases as working features. User explicitly requested a **modular architecture** (no monolithic files).

## Current State (from main branch)

| Use Case | Status | Details |
|----------|--------|---------|
| 01. Todo CRUD | ✅ Done | Basic CRUD with auth stub |
| 02. Priority System | ✅ Done | Full implementation |
| 03. Recurring Todos | ⚠️ Partial | DB columns exist; no next-instance logic |
| 04. Reminders | ⚠️ Partial | DB columns exist; no polling/API/UI |
| 05. Subtasks | ❌ Not started | No table, no API, no UI |
| 06. Tags | ❌ Not started | No tables, no API, no UI |
| 07. Templates | ❌ Not started | No table, no API, no UI |
| 08. Search/Filter | ⚠️ Partial | Priority filter only; no search/advanced |
| 09. Export/Import | ❌ Not started | No API, no UI |
| 10. Calendar | ❌ Not started | No page, no holidays table, no API |
| 11. WebAuthn Auth | ⚠️ Stub | Default local user; no WebAuthn |

## Architecture Overview

- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Database**: SQLite via `better-sqlite3` (sync ops, file: `todos.db`)
- **Auth**: WebAuthn/Passkeys via `@simplewebauthn` with JWT sessions (PRP 11)
- **Testing**: Playwright E2E
- **Timezone**: Singapore (`Asia/Singapore`) — all date ops via `lib/timezone.ts`

## Modular File Structure

```
app/
├── layout.tsx                      # Root layout with fonts, providers
├── page.tsx                        # Main page shell (routes to feature components)
├── login/
│   └── page.tsx                    # WebAuthn login/register page
├── calendar/
│   └── page.tsx                    # Calendar view page
├── api/
│   ├── auth/
│   │   ├── register-options/route.ts
│   │   ├── register-verify/route.ts
│   │   ├── login-options/route.ts
│   │   ├── login-verify/route.ts
│   │   ├── logout/route.ts
│   │   └── me/route.ts
│   ├── todos/
│   │   ├── route.ts                # CRUD: POST create, GET list
│   │   ├── [id]/route.ts           # CRUD: GET single, PUT update, DELETE
│   │   ├── [id]/subtasks/route.ts  # POST create subtask
│   │   ├── [id]/tags/route.ts      # POST attach, DELETE detach tag
│   │   ├── export/route.ts         # GET export JSON/CSV
│   │   └── import/route.ts         # POST import JSON
│   ├── subtasks/
│   │   └── [id]/route.ts           # PUT update, DELETE subtask
│   ├── tags/
│   │   ├── route.ts                # GET list, POST create
│   │   └── [id]/route.ts           # PUT update, DELETE tag
│   ├── templates/
│   │   ├── route.ts                # GET list, POST create
│   │   ├── [id]/route.ts           # PUT update, DELETE template
│   │   └── [id]/use/route.ts       # POST instantiate from template
│   ├── notifications/
│   │   └── check/route.ts          # GET due reminders
│   └── holidays/
│       └── route.ts                # GET holidays by month
components/
├── layout/
│   ├── AppHeader.tsx               # Top nav: logo, calendar link, notifications, logout
│   └── TodoForm.tsx                # Create todo form (title, priority, due date, recurrence, reminder, tag pills, template dropdown, save-template button)
├── todos/
│   ├── TodoSection.tsx             # Renders a section (Overdue/Pending/Completed) with header + count
│   ├── TodoItem.tsx                # Individual todo row (checkbox, title, priority badge, due date, badges)
│   ├── TodoEditModal.tsx           # Edit modal (all fields)
│   ├── PriorityBadge.tsx           # Color-coded priority pill
│   ├── RecurrenceBadge.tsx         # "🔄 pattern" badge
│   ├── ReminderBadge.tsx           # "🔔 1h" badge
│   ├── TagPill.tsx                 # Colored tag badge with name
│   ├── ProgressBar.tsx             # Subtask progress bar (X/Y, percentage)
│   ├── SubtaskList.tsx             # Expandable subtask checklist under a todo
│   └── RecurrenceFields.tsx        # Repeat checkbox + pattern dropdown (extracted from TodoEditModal)
├── filters/
│   ├── FilterBar.tsx               # Search + quick filters (priority, tag)
│   ├── SearchBar.tsx               # Debounced search input
│   └── AdvancedFilters.tsx         # Advanced panel (completion, date range, presets)
├── tags/
│   └── ManageTagsModal.tsx         # Create/edit/delete tags with color picker
├── templates/
│   ├── SaveTemplateModal.tsx       # Capture template from current form state
│   ├── TemplateManagerModal.tsx    # List/use/delete templates
│   └── TemplateCard.tsx            # Single template entry in manager
├── calendar/
│   ├── CalendarGrid.tsx            # 6x7 month grid
│   ├── CalendarCell.tsx            # Single day cell with todo pills + holiday label
│   └── DayTodosModal.tsx           # Todos due on clicked day
├── export/
│   └── ExportImportControls.tsx    # Export JSON/CSV buttons + Import file picker
└── ui/
    ├── NotificationToggle.tsx      # Enable notifications button
    ├── Modal.tsx                   # Reusable modal base
    └── Button.tsx                  # Reusable button with variants
lib/
├── db.ts                           # SQLite init, all tables, all DB interfaces + CRUD objects (~700 lines, single file per spec)
├── auth.ts                         # createSession, getSession, deleteSession (JWT + HTTP-only cookie)
├── timezone.ts                     # getSingaporeNow, formatSingaporeDate, toSingaporeParts, fromSingaporeParts
├── recurrence.ts                   # calculateNextDueDate (daily/weekly/monthly/yearly)
├── todoSort.ts                     # sortTodos, sectionTodos
├── calendar.ts                     # generateCalendarGrid (pure function)
├── filters.ts                      # FilterState type, applyFilters, hasActiveFilters
├── exportImport.ts                 # toJsonExport, toCsvExport, validateImport, importAll (Zod schema)
├── constants.ts                    # PRIORITY_ORDER, REMINDER_LABELS, etc.
└── hooks/
    ├── useNotifications.ts         # Browser notification permission + polling
    ├── useTodos.ts                 # Fetch, create, update, delete todos (API client)
    ├── useTags.ts                  # Fetch, CRUD tags
    ├── useTemplates.ts             # Fetch, CRUD templates, use template
    ├── useDebounce.ts              # useDebounce(value, delay)
    └── useFilterPresets.ts         # Save/load/delete filter presets (localStorage)
scripts/
└── seed-holidays.ts                # Singapore public holidays seeder
middleware.ts                       # Protect / and /calendar; redirect to /login
```

## Remaining Work Summary

| Category | Work Remaining |
|----------|---------------|
| Database | Add 5 missing tables: `subtasks`, `tags`, `todo_tags`, `templates`, `holidays`, `authenticators` |
| Dependencies | Install WebAuthn (`@simplewebauthn/*`), JWT, Zod |
| Modularization | Refactor page.tsx inline components → separate files (~500→~100 lines) |
| Features | Complete recurring, reminders, subtasks, tags, templates, search, export/import, calendar |
| Auth | Replace stub with real WebAuthn + middleware |
| Testing | E2E tests (Playwright) — only unit tests exist currently |

## Implementation Phases (remaining work)

### Phase 0 — Modularize Existing Code + Add Missing DB Tables
**Goal**: Refactor page.tsx inline components; add missing schema tables; install deps.

**Refactor page.tsx → components/**:
- `components/todos/TodoForm.tsx` — extract create form
- `components/todos/TodoItem.tsx` — extract TodoItem
- `components/todos/TodoSection.tsx` — extract Section
- `components/todos/TodoEditModal.tsx` — extract edit modal
- `components/todos/PriorityBadge.tsx` — extract (re-use from lib/priority types)
- `components/filters/PriorityFilter.tsx` — extract priority filter dropdown
- `app/page.tsx` — reduced to ~100 lines orchestrating components

**Database** (`lib/db.ts`):
- Add `CREATE TABLE IF NOT EXISTS` for: `subtasks`, `tags`, `todo_tags`, `templates`, `holidays`, `authenticators`
- Add DB objects: `subtaskDB`, `tagDB`, `templateDB`, `holidayDB`, `authenticatorDB`, `userDB` extended

**Dependencies**: `@simplewebauthn/browser`, `@simplewebauthn/server`, `jsonwebtoken`, `zod`

### Phase 1 — Complete Recurring Todos (Use Case 03)
**Files**:
- `lib/recurrence.ts` — calculateNextDueDate (daily/weekly/monthly/yearly with month-end clamping)
- Update `app/api/todos/[id]/route.ts` PUT — next-instance creation on completion
- `components/todos/RecurrenceBadge.tsx` — "🔄 pattern" badge
- `components/todos/RecurrenceFields.tsx` — repeat checkbox + pattern dropdown
- Update TodoEditModal to include recurrence fields

### Phase 2 — Complete Reminders + Subtasks (Use Cases 04, 05)
**Files**:
- `app/api/notifications/check/route.ts` — due reminders polling endpoint
- `app/api/todos/[id]/subtasks/route.ts` — create subtask
- `app/api/subtasks/[id]/route.ts` — update/delete subtask
- `components/todos/ReminderBadge.tsx` — "🔔 label" badge
- `components/todos/ProgressBar.tsx` — X/Y subtasks bar
- `components/todos/SubtaskList.tsx` — expandable checklist
- `components/ui/NotificationToggle.tsx` — enable notifications button
- `lib/hooks/useNotifications.ts` — permission + 30s polling
- Update TodoForm/TodoEditModal with reminder dropdown

### Phase 3 — Tag System + Search/Filtering (Use Cases 06, 08)
**Files**:
- `app/api/tags/route.ts`, `[id]/route.ts` — tag CRUD
- `app/api/todos/[id]/tags/route.ts` — attach/detach
- `lib/filters.ts` — FilterState, applyFilters, hasActiveFilters
- `components/tags/ManageTagsModal.tsx`, `TagPill.tsx`
- `components/filters/SearchBar.tsx`, `AdvancedFilters.tsx`
- `lib/hooks/useDebounce.ts`, `useFilterPresets.ts`
- Update TodoForm with tag pills selector

### Phase 4 — Template System (Use Case 07)
**Files**:
- `app/api/templates/route.ts`, `[id]/route.ts`, `[id]/use/route.ts`
- `components/templates/SaveTemplateModal.tsx`, `TemplateManagerModal.tsx`, `TemplateCard.tsx`
- Update AppHeader with Templates button
- Update TodoForm with "Use Template" dropdown + "Save as Template" button

### Phase 5 — Export/Import + Calendar (Use Cases 09, 10)
**Files**:
- `lib/exportImport.ts` — toJsonExport, toCsvExport, validateImport (Zod)
- `lib/calendar.ts` — generateCalendarGrid (pure 42-cell function)
- `app/api/todos/export/route.ts`, `import/route.ts`
- `app/api/holidays/route.ts`
- `components/export/ExportImportControls.tsx`
- `components/calendar/CalendarGrid.tsx`, `CalendarCell.tsx`, `DayTodosModal.tsx`
- `app/calendar/page.tsx`
- `scripts/seed-holidays.ts` — Singapore public holidays
- Add Calendar link to AppHeader

### Phase 6 — WebAuthn Authentication (Use Case 11)
**Files**:
- Rewrite `lib/auth.ts` — JWT sessions (createSession/getSession/deleteSession)
- `middleware.ts` — protect / and /calendar; redirect to /login
- `app/api/auth/**/route.ts` — 6 endpoints (register-options/verify, login-options/verify, logout, me)
- `app/login/page.tsx` — WebAuthn login/register with `@simplewebauthn/browser`
- Update AppHeader with logout button
- Add `.env.local` with `RP_NAME`, `RP_ID`, `RP_ORIGIN`, `JWT_SECRET`

### Phase 7 — Testing
- `tests/helpers.ts` — createTodo, addSubtask, createTag, login helpers
- `tests/01-authentication.spec.ts`
- `tests/02-todo-crud.spec.ts`
- `tests/03-features.spec.ts` (all remaining features)
- `playwright.config.ts` — virtual authenticators, Singapore timezone

## Key Conventions (per CLAUDE.md)

1. **Singapore timezone**: Never use `new Date()` — always `getSingaporeNow()` from `lib/timezone.ts`
2. **Async params in Next.js 16**: `const { id } = await params`
3. **Null coalescing**: Use `?? 0` for counter, `?? null` for nullable fields
4. **Auth check first**: Every API route starts with `getSession()`, returns 401 if missing
5. **Cross-user access**: Return 404 (not 403) to avoid leaking resource existence
6. **Better-sqlite3**: All DB ops are synchronous — no async/await for queries
7. **Counter bug prevention**: `authenticator.counter ?? 0` everywhere counter is read
8. **WebAuthn encoding**: Use `isoBase64URL` from `@simplewebauthn/server/helpers`
9. **Client components**: Never import `lib/db.ts` directly
10. **Modularity override**: Files kept to 200-400 lines typical (coding-style.md), overriding CLAUDE.md monolithic page.tsx convention per user request

## Verification

1. Run `npm run dev` — app starts on :3000
2. Register a user via WebAuthn → redirected to / with empty todo list
3. Create todos with all features (priority, recurrence, subtasks, tags, reminders)
4. Complete a recurring todo → next instance auto-created
5. Switch to /calendar → todos appear on correct dates
6. Export JSON → Import JSON → todos restored with relationships
7. Run `npx playwright test` → all E2E tests pass
8. Run `npm run build` → clean production build
