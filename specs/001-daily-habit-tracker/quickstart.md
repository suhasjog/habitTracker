# Developer Quickstart: Daily Habit Tracker

**Branch**: `001-daily-habit-tracker`

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (free tier): https://supabase.com
- Netlify account (free tier): https://netlify.com

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd habitTracker
npm install
```

**New packages to install** (not yet in package.json):
```bash
npm install @supabase/supabase-js react-router-dom @tanstack/react-query
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

---

## 2. Supabase Project Setup

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **SQL Editor** and run the migration:
   ```
   specs/001-daily-habit-tracker/data-model.md  (copy the SQL migration block)
   ```
3. Go to **Storage** → Create a new **private bucket** named `notes`
4. Go to **Settings > API** → copy your Project URL and `anon` key
5. Enable **Auth > Providers > Email** (enabled by default)

---

## 3. VAPID Keys (for Push Notifications)

Generate once and store securely:
```bash
npx web-push generate-vapid-keys
```

Save output to Supabase secrets:
```bash
# Install Supabase CLI first: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:you@example.com"
```

---

## 4. Environment Variables

Create `.env.local` in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

**Never commit `.env.local`** — it is already in `.gitignore`.

---

## 5. Run Development Server

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## 6. Run Tests

```bash
npm run test           # run all tests once
npm run test:watch     # watch mode
```

---

## 7. Deploy to Netlify

### First deploy:
1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
5. Deploy

### Redirect rule (required for React Router SPA):
The `netlify.toml` needs this block:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 8. Deploy Supabase Edge Function

```bash
# Deploy the notification function
supabase functions deploy send-habit-reminders

# Schedule via pg_cron (run in Supabase SQL Editor)
SELECT cron.schedule(
  'habit-push-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-habit-reminders',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## Source Structure (after implementation)

```
src/
├── components/
│   ├── auth/          # LoginForm, RegisterForm
│   ├── habits/        # HabitCard, HabitList, HabitForm
│   ├── checkin/       # NoteRecorder, NoteViewer
│   ├── dashboard/     # WeeklyView, MonthlyView, YearlyView
│   └── ui/            # StreakBadge, NudgeToast, EmptyState
├── hooks/
│   ├── useAuth.js
│   ├── useHabits.js
│   ├── useEntries.js
│   └── useNotification.js
├── pages/
│   ├── AuthPage.jsx
│   ├── HomePage.jsx
│   ├── DashboardPage.jsx
│   └── SettingsPage.jsx
├── services/
│   ├── supabase.js    # Supabase client init
│   ├── habits.js      # CRUD functions
│   ├── entries.js     # Check-in functions
│   └── notes.js       # Note CRUD + storage
├── utils/
│   ├── streaks.js     # calculateStreak()
│   └── dates.js       # Date helpers (today, prevDay, etc.)
├── App.jsx            # Router + QueryClientProvider + AuthProvider
└── main.jsx

supabase/
├── functions/
│   └── send-habit-reminders/
│       └── index.ts   # Edge Function
└── migrations/
    └── 001_initial_schema.sql
```

---

## Key Technical Decisions (summary)

| Concern | Choice | Why |
|---------|--------|-----|
| Auth & DB | Supabase | Free tier covers all needs; SQL for streak queries |
| Routing | React Router v6 | Standard, 3 routes needed |
| Server state | TanStack Query v5 | Caching + optimistic updates |
| Push notifications | VAPID + Supabase Edge Functions | Works with app closed |
| Media recording | Browser MediaRecorder API | No library needed; widely supported |
| Streak calc | Client-side from entries | Avoids denormalized state |
| Hosting | Netlify | Free, auto-deploy, already configured |
| Testing | Vitest + RTL | Same Vite config, zero setup |
