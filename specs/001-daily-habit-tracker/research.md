# Research Findings: Daily Habit Tracker

**Date**: 2026-02-17
**Branch**: `001-daily-habit-tracker`

---

## Decision 1: Backend & Auth Service

**Decision**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

**Rationale**: The spec requires multi-user accounts, per-user data isolation, media file storage (audio/video notes), and server-side scheduled notifications — all at no cost. Supabase provides all four in a single free-tier service and pairs perfectly with a Netlify-hosted frontend (no CORS config needed; Supabase JS client calls are purely HTTPS). PostgreSQL is a better fit than a NoSQL store because streak calculations benefit from SQL date functions, and daily entries have clear relational structure (habit → entry → note).

**Alternatives considered**:
- Firebase: Firestore is NoSQL (less natural for streak/date queries); Firebase Cloud Functions require a paid plan for outbound networking. Eliminated.
- Auth0 + custom backend: Requires hosting and maintaining a separate API server. Contradicts the Netlify-only deployment requirement. Eliminated.
- Supabase free tier limits: 500 MB DB, 1 GB file storage, 2 GB bandwidth, 500k Edge Function invocations/month — adequate for this app at launch.

---

## Decision 2: Frontend Routing

**Decision**: React Router v6 (`react-router-dom`)

**Rationale**: The spec requires "at most 3 primary navigation areas" (FR-024). Three routes are needed: Home (daily check-in), Dashboard (progress), and Settings (habits + notifications). React Router v6 is the de facto standard, already familiar to most React developers, and has stable support for PWA-style navigation.

**Alternatives considered**:
- TanStack Router: More type-safe but adds complexity. Overkill for 3 routes. Eliminated.
- Single-page with conditional rendering: Would make deep-linking to dashboard impossible. Eliminated.

---

## Decision 3: Server State Management

**Decision**: TanStack Query (React Query) v5 + React Context for auth state

**Rationale**: Supabase data is server state. TanStack Query provides caching, background refetching, and optimistic updates out of the box — critical for the instant "mark habit done" UX required by SC-003. Auth state (current user) is stable global state that belongs in React Context (not server state).

**Alternatives considered**:
- Zustand: Good for client state, but adds complexity for server state caching/invalidation. Eliminated.
- useState + useEffect: No caching, refetching, or optimistic update support. Eliminated.

---

## Decision 4: Push Notifications

**Decision**: Server-side VAPID push via Supabase Edge Function (Deno) + `npm:web-push` + `pg_cron` scheduled every hour

**Rationale**: The existing client-side `setTimeout` in `useNotification.js` only works when the browser tab is open — it will never deliver a notification to a user who closed the app. True push requires the browser vendor's push service (FCM for Chrome, Mozilla for Firefox) to deliver via the service worker, even with the app closed.

**Implementation pattern**:
1. Client subscribes via `pushManager.subscribe()` with VAPID public key
2. Subscription object (`endpoint`, `p256dh`, `auth` keys) + IANA timezone saved to Supabase `push_subscriptions` table
3. Supabase Edge Function runs hourly via `pg_cron` (`0 * * * *`)
4. Each run calls `get_subscriptions_for_hour(22)` — a Postgres RPC that filters subscriptions where `extract(hour from (now() at time zone timezone)) = 22`
5. For matching subscriptions, Edge Function checks incomplete habits for that user's today date, sends push via `webpush.sendNotification()`
6. Stale/invalid subscriptions (HTTP 404/410 from push service) are deleted automatically

**Service worker**: `vite-plugin-pwa` must be switched from `autoUpdate` to `injectManifest` mode to allow a custom `push` event handler in the service worker.

**Timezone coverage**: Hourly cron covers all full-hour UTC offset timezones (the vast majority globally). Half-hour offsets (India, Nepal, some Australian states, Iran) will receive notifications at a 30-minute offset from exact 10PM — acceptable per SC-005's 5-minute window caveat. A 30-minute cron (`*/30 * * * *`) with matching SQL filter can cover these if needed later.

**Alternatives considered**:
- Keep client-side `setTimeout`: Only works with app open. Eliminated.
- Periodic Background Sync API: Chrome Android only, minimum interval is browser-controlled (often 12h+). Eliminated.
- OneSignal/FCM (third-party): Works well but routes user data through a third party and adds a vendor dependency. Eliminated for this version.

---

## Decision 5: Media Recording

**Decision**: Browser MediaRecorder API (raw, no library)

**Rationale**: MediaRecorder is "widely available" since April 2021 across Chrome, Firefox, and Safari. No external library needed. Duration enforcement is straightforward: record `chunks` array in `dataavailable` listener, call `mediaRecorder.stop()` via `setTimeout` at the max duration (60s audio, 30s video), then concatenate chunks into a single `Blob` in the `stop` event.

**MIME types (cross-browser)**:
- Audio: Check `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')` → fallback to `audio/mp4` (Safari). Use `audio/webm` for Chrome/Firefox/Android.
- Video: `video/webm;codecs=vp9` for Chrome/Firefox → fallback to `video/mp4` for Safari (iOS 14.3+).

**Upload pattern**:
```js
// After mediaRecorder 'stop' event:
const blob = new Blob(chunks, { type: mimeType })
await supabase.storage.from('notes').upload(`${userId}/${entryId}.webm`, blob)
```

**iOS Safari notes**: MediaRecorder supported since iOS 14.3. Must be in a secure context (HTTPS). Requires user gesture to trigger `getUserMedia`. `audio/mp4` is the reliable fallback for Safari.

**Permission handling**: Catch `NotAllowedError` from `getUserMedia` — fall back to text-only note with a clear "Microphone access denied" message. Do not re-prompt automatically.

**Alternatives considered**:
- `react-media-recorder` library: Thin wrapper around MediaRecorder; adds a dependency but minimal value. Eliminated.
- `RecordRTC`: Adds significant bundle size. Eliminated.

---

## Decision 6: Streak Calculation

**Decision**: Client-side computation from `daily_entries` rows; no stored streak column

**Rationale**: Streaks are always derived from the completion record. Computing them client-side from the fetched `daily_entries` data avoids stale denormalized state and complex triggers. A simple `calculateStreak(sortedDates)` utility function processes the sorted array of completion dates per habit. Performance is not a concern: maximum 365 entries per habit per year.

**Algorithm**:
```js
// Returns consecutive days ending on today (or yesterday if today not yet done)
function calculateStreak(sortedCompletionDates, today) {
  let streak = 0
  let cursor = today
  for (const date of [...sortedCompletionDates].reverse()) {
    if (date === cursor || date === dayBefore(cursor)) {
      streak++
      cursor = date
    } else break
  }
  return streak
}
```

---

## Decision 7: Deployment & Environment

**Decision**: Netlify (frontend PWA) + Supabase (backend)

**Rationale**: Netlify auto-deploys from the main branch, handles the Vite build, and serves the PWA. The existing `netlify.toml` is already present. A single redirect rule (`/* → /index.html 200`) is required for React Router SPA navigation. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`) are set in Netlify's dashboard UI.

**Netlify `netlify.toml` additions needed**:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Decision 8: Testing

**Decision**: Vitest + React Testing Library

**Rationale**: Vitest uses the same Vite config — zero additional configuration. React Testing Library encourages testing from the user's perspective (matching spec acceptance scenarios). Mock Supabase client for unit tests.

**Alternatives considered**:
- Jest: Requires separate config, slower with ESM. Eliminated.
- Playwright (E2E): Valuable but scope for a later phase. Eliminated from initial setup.
