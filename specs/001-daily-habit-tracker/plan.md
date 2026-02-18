# Implementation Plan: Daily Habit Tracker

**Branch**: `001-daily-habit-tracker` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-daily-habit-tracker/spec.md`

---

## Summary

Build a multi-user daily habit tracker PWA on the existing React 19 + Vite foundation. The existing single-user localStorage app is replaced with a Supabase-backed multi-user system supporting email/password auth, cloud-stored habit data and rich notes (text/audio/video), a progress dashboard (weekly/monthly/yearly), streak rewards, and server-side 10PM push notification reminders via Supabase Edge Functions.

---

## Technical Context

**Language/Version**: JavaScript (ES2024) — React 19, Vite 7
**Primary Dependencies**:
- `@supabase/supabase-js` ^2 — auth, database, storage
- `react-router-dom` ^6 — SPA routing (3 routes)
- `@tanstack/react-query` ^5 — server state, caching, optimistic updates
- `vite-plugin-pwa` ^1.2 (existing) — PWA, service worker (switch to `injectManifest` mode)
- `npm:web-push` (Deno, Edge Function only) — VAPID push notifications

**Storage**: Supabase PostgreSQL (habits, entries, notes metadata, push subscriptions, preferences) + Supabase Storage (audio/video note files, `notes` private bucket)

**Testing**: Vitest + React Testing Library (to be installed)

**Target Platform**: Mobile-first PWA; tested on Chrome Android, Safari iOS 14.3+, Chrome Desktop

**Performance Goals**: Dashboard load < 2s for 1 year of history; check-in interactions < 1s; streak computation < 50ms

**Constraints**: Offline support for habits/check-ins/dashboard (SC-007); push notifications require app to be installed and notification permission granted; HTTPS required for MediaRecorder and push subscriptions

**Scale/Scope**: Single region; up to ~1000 daily active users on Supabase free tier; max 10 habits per user, max 365 entries per habit per year

---

## Constitution Check

*No project constitution has been configured (constitution.md contains only the template). No gates to evaluate.*

**Post-design check**: No violations identified. The plan uses a single project structure (no unnecessary monorepo split), minimizes abstractions (services layer maps 1:1 to Supabase calls), and adds only packages that directly enable a required feature.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-habit-tracker/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research decisions
├── data-model.md        # Database schema + entity definitions
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── api.md           # Supabase call contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Email/password sign-in form
│   │   └── RegisterForm.jsx       # New account creation form
│   ├── habits/
│   │   ├── HabitCard.jsx          # Single habit row: name, streak, check/uncheck, note icon
│   │   ├── HabitList.jsx          # Today's habit list (replaces existing)
│   │   └── HabitForm.jsx          # Add/edit habit (replaces AddHabit.jsx)
│   ├── checkin/
│   │   ├── NoteRecorder.jsx       # Modal: choose text/audio/video, record, save
│   │   └── NoteViewer.jsx         # Inline playback of attached note
│   ├── dashboard/
│   │   ├── WeeklyView.jsx         # 7-day grid per habit
│   │   ├── MonthlyView.jsx        # 30-day heatmap per habit
│   │   └── YearlyView.jsx         # 12-month summary per habit
│   └── ui/
│       ├── StreakBadge.jsx         # Flame icon + count display
│       ├── NudgeToast.jsx          # 2-day miss gentle nudge
│       └── EmptyState.jsx          # Encouraging empty screens
├── hooks/
│   ├── useAuth.js                  # Supabase auth state (login, register, logout, user)
│   ├── useHabits.js                # TanStack Query: habits CRUD
│   ├── useEntries.js               # TanStack Query: daily entries, optimistic toggle
│   ├── useStreaks.js                # Derived: calculateStreak per habit from entries
│   └── useNotification.js          # Push subscription management (rewrite)
├── pages/
│   ├── AuthPage.jsx                # Login / Register tabs
│   ├── HomePage.jsx                # Daily check-in (primary view)
│   ├── DashboardPage.jsx           # Progress views (weekly/monthly/yearly)
│   └── SettingsPage.jsx            # Manage habits + notification preferences
├── services/
│   ├── supabase.js                 # createClient() — Supabase singleton
│   ├── habits.js                   # getHabits, createHabit, updateHabit, deleteHabit
│   ├── entries.js                  # getEntries, markComplete, unmarkComplete
│   └── notes.js                    # getNote, createNote, deleteNote, getSignedUrl
├── utils/
│   ├── streaks.js                  # calculateStreak(dates, today), isMissStreak(dates, today)
│   └── dates.js                    # localDate(), prevDay(), dateRange()
├── App.jsx                         # BrowserRouter + QueryClientProvider + AuthContext
└── main.jsx                        # (unchanged)

supabase/
├── functions/
│   └── send-habit-reminders/
│       └── index.ts                # Deno Edge Function: VAPID push at 10PM per timezone
└── migrations/
    └── 001_initial_schema.sql      # Full schema (from data-model.md)

public/
└── sw.js                           # Custom service worker source (injectManifest mode)
```

**Structure Decision**: Single web application — no backend/frontend split. Supabase is the backend. Frontend is the React PWA. Edge Functions live in `supabase/functions/` as a sub-directory of the same repo.

---

## Complexity Tracking

No constitution violations. No complexity justification required.

---

## Implementation Phases

### Phase 0 (Complete) — Research
All technology decisions resolved. See [research.md](./research.md).

### Phase 1 (Complete) — Design & Contracts
- [x] [data-model.md](./data-model.md) — PostgreSQL schema, entities, RLS, triggers, streak algorithm
- [x] [contracts/api.md](./contracts/api.md) — Supabase call signatures for all user actions
- [x] [quickstart.md](./quickstart.md) — Developer setup and deployment guide

### Phase 2 — Tasks
Run `/speckit.tasks` to generate `tasks.md`.

---

## Feature-to-Implementation Mapping

| Spec Requirement | Implementation |
|-----------------|----------------|
| FR-001/002/003: 1–10 habits per user | `habits` table + `check_habit_limit` trigger; `HabitForm` validates client-side too |
| FR-004: Edit habits | `HabitForm` in edit mode; `updateHabit` service; preserves all entries |
| FR-005: Delete habits | `deleteHabit` service; CASCADE deletes entries and notes |
| FR-006/007/008: Daily check-in | `HomePage` + `HabitCard` toggle; `useEntries` optimistic update |
| FR-009: Reset at midnight | Client computes today's local date on every render; entries are date-keyed |
| FR-010/011: Notes (text/audio/video) | `NoteRecorder` component; MediaRecorder API; Supabase Storage |
| FR-012/013/014/015: 10PM notifications | `send-habit-reminders` Edge Function; pg_cron; VAPID; `useNotification` rewrite |
| FR-016/017: Progress dashboard | `DashboardPage` with `WeeklyView`, `MonthlyView`, `YearlyView` |
| FR-018/019/020/021: Streaks & nudges | `useStreaks` hook; `calculateStreak` util; `StreakBadge`, `NudgeToast` components |
| FR-022: Multi-user auth | Supabase Auth; `useAuth` hook; `AuthPage`; `ProtectedRoute` wrapper |
| FR-023: Empty state | `EmptyState` component on `HomePage` and `DashboardPage` |
| FR-024: Simple UI (≤3 nav areas) | Bottom nav: Home / Dashboard / Settings |

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| iOS Safari MediaRecorder MIME type | Use `MediaRecorder.isTypeSupported()` check; fall back to `audio/mp4`, `video/mp4` |
| iOS Safari push notification support | iOS 16.4+ supports Web Push in installed PWAs; document limitation for older iOS |
| `vite-plugin-pwa` SW customization | Switch to `injectManifest` mode; maintain `public/sw.js` with Workbox + push handler |
| Supabase free tier cold starts | Edge Functions may have ~500ms cold start; acceptable for cron job at 10PM |
| Half-hour timezones (India, Nepal) | Documented in research; accepted tradeoff; 30-min cron optional follow-up |
| Existing localStorage data migration | Out of scope — new auth-based app starts fresh; old local data not migrated |
