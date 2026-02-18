# Tasks: Daily Habit Tracker

**Input**: Design documents from `specs/001-daily-habit-tracker/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks grouped by user story (US1–US6) to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install packages, create directory scaffold, configure environment

- [x] T001 Install required npm packages: `npm install @supabase/supabase-js react-router-dom @tanstack/react-query` and dev packages: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`
- [x] T002 [P] Create source directories: `src/services/`, `src/pages/`, `src/components/auth/`, `src/components/habits/`, `src/components/checkin/`, `src/components/dashboard/`, `src/components/ui/`
- [x] T003 [P] Create Supabase directories: `supabase/migrations/`, `supabase/functions/send-habit-reminders/`
- [x] T004 [P] Create `src/utils/dates.js` with helpers: `localDate()` (returns today's YYYY-MM-DD in device timezone), `prevDay(dateStr)` (returns prior day string), `dateRange(start, end)` (returns array of date strings)
- [x] T005 [P] Update `netlify.toml` to add SPA redirect rule: `[[redirects]] from="/*" to="/index.html" status=200`
- [x] T006 [P] Create `.env.local` (git-ignored) with variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` — and document each in a comment; verify `.gitignore` already excludes `.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth layer, app shell, and routing — MUST be complete before any user story begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create `supabase/migrations/001_initial_schema.sql` with the complete SQL from `specs/001-daily-habit-tracker/data-model.md`: tables (`habits`, `daily_entries`, `notes`, `push_subscriptions`, `user_preferences`), triggers (`check_habit_limit`), RLS policies for all tables, and the `get_subscriptions_for_hour(target_hour int)` RPC function
- [x] T008 [P] Create `src/services/supabase.js` — singleton `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`; export as named `supabase`
- [x] T009 Create `src/hooks/useAuth.js` — wraps `supabase.auth.onAuthStateChange` in a `useEffect`; exposes `{ user, session, loading, signIn, signUp, signOut }`; `signIn` calls `supabase.auth.signInWithPassword`, `signUp` calls `supabase.auth.signUp`, `signOut` calls `supabase.auth.signOut`
- [x] T010 [P] Create `src/components/auth/LoginForm.jsx` — controlled form with email + password fields; calls `signIn` from `useAuth`; displays inline error message on `invalid_credentials`; shows loading state on submit
- [x] T011 [P] Create `src/components/auth/RegisterForm.jsx` — controlled form with email + password fields; calls `signUp` from `useAuth`; shows "check your email to confirm" message on success (Supabase email confirmation enabled by default); shows inline error on duplicate email
- [x] T012 Create `src/pages/AuthPage.jsx` — tab switcher between `LoginForm` and `RegisterForm`; redirects to `/` when `user` is non-null (use `useNavigate`)
- [x] T013 [P] Create `src/components/ui/EmptyState.jsx` — accepts `icon` (emoji or SVG), `title`, `message`, `actionLabel`, `onAction` props; renders centered encouragement with optional CTA button
- [x] T014 [P] Create `src/components/ui/BottomNav.jsx` — three navigation items: Home (`/`), Dashboard (`/dashboard`), Settings (`/settings`); highlights active route using `useLocation`; fixed to bottom of viewport; icons: Home=🏠, Dashboard=📊, Settings=⚙️
- [x] T015 Rewrite `src/App.jsx` — wrap with `QueryClientProvider` (new `QueryClient`), `BrowserRouter`, and an `AuthContext` (from `useAuth`); define routes: `/auth` → `AuthPage`, `/` → `HomePage` (protected), `/dashboard` → `DashboardPage` (protected), `/settings` → `SettingsPage` (protected); implement `ProtectedRoute` wrapper that redirects unauthenticated users to `/auth`; render `BottomNav` below routes for authenticated users; delete `src/App.css` and create a minimal `src/App.css` with CSS variables for theme color `#6c63ff`, max-width 480px centered layout, and bottom-nav padding

**Checkpoint**: App launches, shows auth screen, user can register/login, protected routes redirect to `/auth` when unauthenticated

---

## Phase 3: User Story 1 — Habit Management (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can add (1–10), edit, and delete daily habits; list persists across sessions

**Independent Test**: Register → log in → add "Yoga", "Meditation", "Journaling" → edit "Yoga" to "Morning Yoga" → delete "Journaling" → close and reopen app → see "Morning Yoga" and "Meditation" persisted

- [x] T016 [P] [US1] Create `src/services/habits.js` — `getHabits(userId)`: select all habits ordered by position; `createHabit(userId, name, description)`: insert row, returns habit; `updateHabit(id, name, description)`: update name/description/updated_at; `deleteHabit(id)`: delete by id; all calls use the `supabase` singleton; handle P0001 trigger error (10-habit limit) and surface as a user-readable message
- [x] T017 [P] [US1] Create `src/components/habits/HabitForm.jsx` — modal/sheet form with `name` input (required, max 100 chars) and optional `description` textarea (max 500 chars); accepts `initialValues` prop for edit mode and `onSave`/`onCancel` callbacks; shows character count; disables save when name is empty
- [x] T018 [US1] Create `src/hooks/useHabits.js` — `useQuery` to fetch habits via `getHabits`; `useMutation` for `createHabit` (with query invalidation), `updateHabit`, `deleteHabit`; exposes `{ habits, isLoading, addHabit, editHabit, removeHabit, atLimit }` where `atLimit = habits.length >= 10`
- [x] T019 [US1] Create `src/components/habits/HabitCard.jsx` — displays habit `name` and `description`; shows edit (✏️) and delete (🗑️) action buttons; integrates `HabitForm` for inline editing; shows confirmation before delete; accepts `habit` prop — check-in state and notes will be added in later phases
- [x] T020 [US1] Create `src/components/habits/HabitList.jsx` — maps `habits` array to `HabitCard` components; renders `EmptyState` when habits array is empty (message: "Add your first habit to get started"); accepts `habits`, `onEdit`, `onDelete` props
- [x] T021 [US1] Create `src/pages/SettingsPage.jsx` — shows `HabitList` with edit/delete; shows "Add Habit" button (disabled with tooltip when `atLimit`); shows habit count badge "X/10 habits"; uses `useHabits` hook; wire into `App.jsx` routes (already declared in T015)

**Checkpoint**: Authenticated user can fully manage their habit list from Settings page; habits persist after page refresh; adding an 11th habit is blocked with a clear message

---

## Phase 4: User Story 2 — Daily Activity Check-In (Priority: P2)

**Goal**: Users see today's habits and can tap to mark them done or undone; resets at midnight

**Independent Test**: Log in → see today's habit list on Home → tap "Yoga" → see it marked done → reload app → see it still marked done → open app next day → see all habits uncompleted

- [x] T022 [US2] Create `src/services/entries.js` — `getEntries(userId, habitIds, startDate, endDate)`: select daily_entries by habit_ids and date range; `markComplete(userId, habitId, date)`: upsert with `onConflict: 'habit_id,date'`; `unmarkComplete(habitId, date)`: delete by habit_id + date
- [x] T023 [US2] Create `src/hooks/useEntries.js` — `useQuery` fetching today's entries for all user habits; `useMutation` for `markComplete` with optimistic update (immediately toggle in cache before server confirms); `useMutation` for `unmarkComplete` with optimistic rollback on error; exposes `{ todayEntries, isCompleted(habitId), toggleCompletion(habitId) }`; `todayEntries` uses `localDate()` from `src/utils/dates.js`
- [x] T024 [US2] Update `src/components/habits/HabitCard.jsx` — add `isCompleted` boolean prop and `onToggle` callback; render a large tappable checkbox/checkmark area; apply a "completed" visual style (strikethrough name, dimmed, green checkmark); animate the transition using CSS; keep edit/delete actions accessible but visually secondary when completed
- [x] T025 [US2] Create `src/pages/HomePage.jsx` — shows today's date header; renders `HabitList` with completion state from `useEntries`; passes `onToggle` to each `HabitCard`; shows a full-page "All done! 🎉" celebratory state when `completedCount === totalCount && totalCount > 0`; renders `EmptyState` (with link to Settings) when user has no habits; uses both `useHabits` and `useEntries` hooks

**Checkpoint**: Daily check-in is fully functional; completion state is optimistically updated and persists to Supabase; new day shows clean slate

---

## Phase 5: User Story 3 — Activity Notes (Priority: P3)

**Goal**: Users can attach a text, audio (≤60s), or video (≤30s) note to any completed habit entry; notes are viewable

**Independent Test**: Complete "Yoga" → tap note icon → choose "text" → type "Felt great!" → save → see note indicator on habit card → tap to view note text

- [x] T026 [P] [US3] Create `src/services/notes.js` — `getNote(entryId)`: select note by entry_id (returns null if none); `createTextNote(entryId, userId, content)`: insert text note; `createMediaNote(entryId, userId, type, blob)`: upload blob to Supabase Storage at path `{userId}/{entryId}.{ext}` (derive ext from `blob.type`), then insert note row with `storage_path`; `deleteNote(noteId, storagePath?)`: delete storage file first if media, then delete DB row; `getSignedUrl(storagePath)`: create signed URL (3600s expiry)
- [x] T027 [P] [US3] Create `src/hooks/useMediaRecorder.js` — state machine: `'idle' | 'requesting' | 'recording' | 'stopped' | 'error'`; `getMimeType(type)` checks `isTypeSupported` with priority list (webm/opus → mp4 for audio; vp9/webm → mp4 for video); `start()` calls `getUserMedia`, creates `MediaRecorder` with `timeslice: 1000` for chunk collection, sets `setTimeout` to call `stop()` at max duration (60000ms audio / 30000ms video); `stop()` clears timer, stops tracks; `onstop` concatenates chunks into a Blob; exposes `{ state, elapsed, blob, mimeType, start, stop, reset }`; catches `NotAllowedError` → sets error message "Permission denied — allow access in browser settings"; catches `NotFoundError` → "No microphone/camera found"
- [x] T028 [US3] Create `src/components/checkin/NoteRecorder.jsx` — modal sheet; shows three option buttons: "Text", "Audio", "Video"; text mode: `<textarea>` with save/cancel; audio mode: shows mic icon, recording timer countdown (60 - elapsed), record/stop buttons, audio playback preview before saving; video mode: shows live camera preview via `<video>` element, recording timer (30 - elapsed), record/stop, video playback before saving; uses `useMediaRecorder` hook; on save calls `createMediaNote` or `createTextNote` from notes service; handles permission denied gracefully — shows error message and falls back to text option; accepts `entryId`, `userId`, `onSaved`, `onClose` props
- [x] T029 [US3] Create `src/components/checkin/NoteViewer.jsx` — accepts `note` prop; for `type='text'`: renders text in a styled container; for `type='audio'`: fetches signed URL via `getSignedUrl`, renders `<audio controls>`; for `type='video'`: fetches signed URL, renders `<video controls playsinline>`; shows loading state while fetching signed URL; shows delete button that calls `deleteNote` then `onDeleted` callback
- [x] T030 [US3] Update `src/components/habits/HabitCard.jsx` — add note icon (📝) when `isCompleted` is true; clicking note icon opens `NoteRecorder` if no note exists, or `NoteViewer` if note exists (use `getNote` to check); show a filled note indicator dot when a note is present; pass `entryId` and `userId` to note components; fetch note status using `useQuery` keyed on `entryId`

**Checkpoint**: User can complete a habit, record a text note, and view it back; audio/video recording works with live timer; permission denied gracefully shows fallback

---

## Phase 6: User Story 4 — Progress Dashboard (Priority: P4)

**Goal**: Dashboard shows per-habit completion history in weekly, monthly, and yearly views with tab switcher

**Independent Test**: Log in with 2 weeks of data → open Dashboard → see weekly grid with correct completion dots → switch to monthly → see 30-day view → switch to yearly → see 12-month summary → switch views multiple times without errors

- [x] T031 [P] [US4] Create `src/components/dashboard/WeeklyView.jsx` — receives `habits[]` and `entries[]` (last 7 days); renders a grid: habits as rows, last 7 days as columns with day-of-week headers; shows ✅ or empty circle per cell; shows completion percentage for each habit (X/7 days); uses `dateRange` from `src/utils/dates.js`
- [x] T032 [P] [US4] Create `src/components/dashboard/MonthlyView.jsx` — receives `habits[]` and `entries[]` (last 30 days); renders one row per habit with a 30-cell mini-calendar; filled cells = completed; shows completion percentage (X/30); groups cells in rows of 7 for readability
- [x] T033 [P] [US4] Create `src/components/dashboard/YearlyView.jsx` — receives `habits[]` and `entries[]` (last 365 days); renders one row per habit with 12 month columns; each cell shows completion rate for that month as a filled/shaded circle or bar; hover/tap shows "X/N days in [Month]" tooltip
- [x] T034 [US4] Create `src/pages/DashboardPage.jsx` — tab switcher: "Week" / "Month" / "Year"; fetches entries for the required date range using `useQuery` + `getEntries` service; fetches habits via `useHabits`; renders the appropriate view component; shows `EmptyState` when no habits exist (link to Settings) or no data for the selected period; shows loading skeleton while fetching
- [x] T035 [US4] Update `src/App.jsx` to import and render `DashboardPage` at the `/dashboard` route (route placeholder declared in T015; now wire up the real component)

**Checkpoint**: Dashboard loads with real data, all three views render correctly, tab switching works, empty state shows appropriately

---

## Phase 7: User Story 5 — Streak Rewards & Nudges (Priority: P5)

**Goal**: App shows streak count per habit; celebrates 3-day streak; nudges after 2-day miss

**Independent Test**: Complete "Yoga" 3 days in a row → on day 3, see streak reward animation/message → miss "Meditation" 2 days → on day 3, see nudge message → complete "Meditation" → nudge dismisses

- [x] T036 [P] [US5] Create `src/utils/streaks.js` — `calculateStreak(sortedDateStrings, todayStr)`: counts consecutive days from today backwards (today counts if present, or yesterday is the anchor if today not yet done); returns integer streak count; `isMissStreak(sortedDateStrings, todayStr)`: returns true if both today and yesterday are absent from the date strings (2-day miss); `isStreakReward(streak)`: returns true when streak ≥ 3; export all three
- [x] T037 [P] [US5] Create `src/components/ui/StreakBadge.jsx` — accepts `streak` (number) and `isReward` (bool) props; renders a flame emoji 🔥 with count when streak ≥ 1; applies a pulsing CSS animation and gold color when `isReward` is true; renders nothing when streak = 0
- [x] T038 [P] [US5] Create `src/components/ui/NudgeToast.jsx` — accepts `habitName` (string) and `onDismiss` callback; renders a gentle bottom-of-screen toast: "Don't give up on [habitName]! You've got this 💪"; auto-dismisses after 5 seconds; can also be manually dismissed; uses CSS slide-up animation
- [x] T039 [US5] Create `src/hooks/useStreaks.js` — receives `habits[]` and all historical `entries[]` (last 30 days is sufficient for streak calculation); for each habit, computes `streak` and `isMissing` using `src/utils/streaks.js`; returns a Map keyed by `habitId` with `{ streak, isReward, isMissing }` values
- [x] T040 [US5] Update `src/pages/HomePage.jsx` — import `useStreaks` and pass historical entries (fetch last 30 days via `getEntries`); pass `streak` and `isReward` props to each `HabitCard` (update HabitCard to render `StreakBadge`); show `NudgeToast` for the first habit where `isMissing` is true (show one at a time, dismiss moves to next); on completing a habit with streak ≥ 3, show a brief reward banner at top of screen

**Checkpoint**: Streak count shows on each habit card; 3-day milestone triggers celebration; 2-day miss shows nudge; completing habit dismisses nudge

---

## Phase 8: User Story 6 — 10PM Reminder Notifications (Priority: P6)

**Goal**: Server sends push notification at 10PM per user's timezone for any uncompleted habits; users can opt in/out

**Independent Test**: Grant notification permission → leave one habit uncompleted → at 10PM device time → receive push notification naming the habit → close the app completely → notification still arrives via service worker

- [x] T041 [US6] Update `vite.config.js` — change `vite-plugin-pwa` from `registerType: 'autoUpdate'` to `strategies: 'injectManifest'` with `srcDir: 'public'` and `filename: 'sw.js'`; keep all existing manifest options; add Supabase CDN origin to `workbox.runtimeCaching` patterns for API calls
- [x] T042 [P] [US6] Create `public/sw.js` — Workbox `injectManifest` entry point: import Workbox precache manifest with `import { precacheAndRoute } from 'workbox-precaching'; precacheAndRoute(self.__WB_MANIFEST)`; add `push` event listener that calls `self.registration.showNotification(data.title, { body, icon, badge, tag })` from `event.data.json()`; add `notificationclick` handler that opens the app URL and closes the notification
- [x] T043 [US6] Create `supabase/functions/send-habit-reminders/index.ts` — import `webpush` from `npm:web-push@3.6.7` and `createClient` from `npm:@supabase/supabase-js@2`; call `webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)` from `Deno.env`; call `supabase.rpc('get_subscriptions_for_hour', { target_hour: 22 })` to get subscriptions where local time is 10PM; for each subscription: compute user's local today date using `Intl.DateTimeFormat` with their `timezone`, query habits and daily_entries for incomplete habits, call `webpush.sendNotification` if any are incomplete; on HTTP 404/410 response from push service: delete that subscription row; return JSON response with sent count
- [x] T044 [US6] Rewrite `src/hooks/useNotification.js` — remove the old `setTimeout`-based approach; `requestPermission()`: calls `Notification.requestPermission()`, then `navigator.serviceWorker.ready`, then `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY) })`, then upserts subscription to Supabase `push_subscriptions` table with `Intl.DateTimeFormat().resolvedOptions().timeZone`; `revokePermission()`: deletes subscription row from Supabase; exposes `{ permission, notificationsEnabled, requestPermission, revokePermission }`; include `urlBase64ToUint8Array` helper that converts the VAPID public key string to a `Uint8Array`
- [x] T045 [US6] Update `src/pages/SettingsPage.jsx` — add a "Notifications" section below the habit list; if `permission === 'default'`: show "Enable 10PM reminders" toggle with explanation text; if `permission === 'granted'` and `notificationsEnabled`: show "Reminders enabled ✅" with an opt-out button; if `permission === 'denied'`: show "Notifications blocked — enable in browser settings" with instructions; use `useNotification` hook
- [x] T046 [US6] Create `supabase/migrations/002_push_cron.sql` — enable `pg_cron` extension, enable `pg_net` extension, schedule the edge function call: `SELECT cron.schedule('habit-push-notifications', '0 * * * *', $$SELECT net.http_post(url := 'https://PROJECT_REF.supabase.co/functions/v1/send-habit-reminders', headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb, body := '{}'::jsonb)$$)`; add comment explaining the `PROJECT_REF` and `SERVICE_ROLE_KEY` placeholders must be replaced before running

**Checkpoint**: Push subscription saves to Supabase; Edge Function deployed; cron runs hourly; at 10PM notification arrives even with app closed (test in Chrome); Settings page shows notification status

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Responsive styling, loading states, offline support, and cleanup

- [x] T047 [P] Add responsive mobile-first CSS to all page and component files — ensure all pages use max-width 480px centered layout; habit card has minimum 48px tap target height; bottom nav is fixed with safe-area padding for iOS notch (`env(safe-area-inset-bottom)`); dashboard grid is scrollable horizontally on small screens; add smooth page transitions
- [x] T048 [P] Add loading skeletons and error states to `src/pages/HomePage.jsx` and `src/pages/DashboardPage.jsx` — while habits/entries load, show 3–5 skeleton habit card placeholders (gray animated bars); on Supabase query error, show inline error banner with retry button
- [x] T049 Update `src/hooks/useEntries.js` and `src/hooks/useHabits.js` for offline-first support (SC-007) — in `useEntries`: cache today's entries in `localStorage` on every successful fetch; read from `localStorage` as initial data when offline (`navigator.onLine === false`); queue `markComplete`/`unmarkComplete` mutations in `localStorage` when offline and replay them on reconnect via a `window.addEventListener('online', ...)` handler; in `useHabits`: similarly cache habits list in `localStorage` for offline reading
- [x] T050 Delete legacy files no longer needed: `src/utils/storage.js` (replaced by Supabase services), `src/components/AddHabit.jsx` (replaced by `HabitForm.jsx`), `src/components/HabitItem.jsx` (replaced by `HabitCard.jsx`)
- [x] T051 Validate end-to-end flow against `specs/001-daily-habit-tracker/quickstart.md` — run `npm run build` and verify no build errors; deploy to Netlify preview; verify: auth sign-up + email confirm + login, habit CRUD, daily check-in, note recording (text at minimum), dashboard data, notification opt-in prompt; confirm `netlify.toml` redirect rule works (navigate directly to `/dashboard` URL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Foundational complete — no dependency on other user stories
- **US2 (Phase 4)**: Requires Foundational + US1 (HabitCard, HabitList, useHabits needed)
- **US3 (Phase 5)**: Requires US2 (needs entry IDs from completed habits)
- **US4 (Phase 6)**: Requires US2 (needs entries data); can run in parallel with US3
- **US5 (Phase 7)**: Requires US2 (needs historical entries); can run in parallel with US3/US4
- **US6 (Phase 8)**: Requires Foundational (Supabase, auth) — can be worked independently of US3–US5
- **Polish (Phase 9)**: Requires all user stories complete

### User Story Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            ├── Phase 3 (US1: Habits CRUD) ────────────────────────────┐
            │       └── Phase 4 (US2: Check-In) ───────────────────────┤
            │               ├── Phase 5 (US3: Notes)                   ├── Phase 9 (Polish)
            │               ├── Phase 6 (US4: Dashboard)               │
            │               └── Phase 7 (US5: Streaks)                 │
            └── Phase 8 (US6: Notifications) ──────────────────────────┘
```

### Within Each User Story

- [P] tasks within a phase can run in parallel
- Service files before hooks
- Hooks before components
- Components before pages
- Page before route wiring

### Parallel Opportunities

```
# Phase 1 — all [P] tasks in parallel:
T002 Create src/ directories
T003 Create supabase/ directories
T004 Create dates.js
T005 Update netlify.toml
T006 Create .env.local

# Phase 2 — parallel after T008:
T010 LoginForm.jsx
T011 RegisterForm.jsx
T013 EmptyState.jsx
T014 BottomNav.jsx

# Phase 3 — parallel start:
T016 habits.js service
T017 HabitForm.jsx

# Phase 5 — parallel start:
T026 notes.js service
T027 useMediaRecorder.js

# Phase 6 — all three views in parallel:
T031 WeeklyView.jsx
T032 MonthlyView.jsx
T033 YearlyView.jsx

# Phase 7 — parallel start:
T036 streaks.js utility
T037 StreakBadge.jsx
T038 NudgeToast.jsx
```

---

## Implementation Strategy

### MVP First (P1 + P2 = Working Habit Tracker)

1. Complete **Phase 1: Setup**
2. Complete **Phase 2: Foundational** (auth + app shell)
3. Complete **Phase 3: US1** (habit management)
4. Complete **Phase 4: US2** (daily check-in)
5. **STOP AND VALIDATE**: Working multi-user habit tracker with persistence
6. Deploy to Netlify — this is already a useful app

### Incremental Delivery

| After Phase | What users get |
|-------------|---------------|
| Phase 4 | Full auth + habit management + daily check-in (**MVP**) |
| Phase 5 | + Rich notes (text/audio/video) |
| Phase 5 + 6 | + Progress dashboard |
| Phase 5 + 6 + 7 | + Streak rewards and nudges |
| All phases | + Server-side push notifications |

### Parallel Team Strategy

After Phase 2 (Foundational) is complete:
- **Track A**: Phase 3 → Phase 4 → Phase 5 (habit core loop)
- **Track B**: Phase 6 (dashboard views — independent of notes)
- **Track C**: Phase 8 (push notifications — only needs auth + Supabase)

---

## Notes

- No test tasks generated (not requested in spec)
- [P] = parallelizable — different files, no incomplete dependencies
- [USn] = maps to User Story n from spec.md
- Commit after each task or logical group before starting the next
- Each phase checkpoint is a deployable increment
- T049 (offline support) is the most complex task — may need IndexedDB (idb-keyval) if localStorage size is insufficient for historical entries
- T041 (vite-plugin-pwa mode change) is a breaking change to the SW build — test PWA install before and after
- Run `npx web-push generate-vapid-keys` once before starting Phase 8 and store keys in Supabase secrets per quickstart.md
