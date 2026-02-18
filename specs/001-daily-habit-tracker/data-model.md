# Data Model: Daily Habit Tracker

**Branch**: `001-daily-habit-tracker`
**Date**: 2026-02-17

---

## Entity Overview

```
auth.users (Supabase managed)
    │
    ├── habits (1..10 per user)
    │       │
    │       └── daily_entries (1 per habit per day)
    │                   │
    │                   └── notes (0..1 per entry)
    │
    ├── push_subscriptions (0..N per user, 1 per device)
    └── user_preferences (1 per user)
```

---

## Entity: User

Managed entirely by **Supabase Auth** (`auth.users` table). No custom user table required.

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key, referenced by all other tables |
| email | text | Used for login |
| created_at | timestamptz | Account creation time |

**Validation rules**:
- Email must be valid format (enforced by Supabase Auth)
- Password minimum 8 characters (enforced by Supabase Auth)

---

## Entity: Habit

A recurring daily activity defined by a user.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → auth.users, NOT NULL, ON DELETE CASCADE | |
| name | text | NOT NULL, max 100 chars | Display name |
| description | text | nullable, max 500 chars | Optional context |
| position | integer | NOT NULL, default 0 | Display sort order |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | Updated on edit |

**Validation rules**:
- Maximum 10 habits per user — enforced via PostgreSQL trigger `check_habit_limit`
- `name` is required and must not be blank after trimming
- `name` must be unique per user (soft recommendation, not enforced at DB level — enforced in app)
- Deleting a habit cascades to all its `daily_entries` (and transitively to `notes`)

**Trigger — habit limit enforcement**:
```sql
CREATE OR REPLACE FUNCTION public.check_habit_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM public.habits WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 habits per user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.check_habit_limit();
```

**RLS Policy**:
```sql
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits"
  ON public.habits FOR ALL USING (auth.uid() = user_id);
```

---

## Entity: DailyEntry

A record that a specific habit was completed on a specific date.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → auth.users, NOT NULL, ON DELETE CASCADE | Denormalized for RLS efficiency |
| habit_id | uuid | FK → habits, NOT NULL, ON DELETE CASCADE | |
| date | date | NOT NULL | Local date (YYYY-MM-DD) in user's timezone |
| completed_at | timestamptz | NOT NULL, default now() | UTC timestamp of completion |

**Unique constraint**: `(habit_id, date)` — one entry per habit per day.

**Validation rules**:
- `date` is always the user's local date (computed client-side from `new Date().toLocaleDateString('en-CA')`)
- Creating a duplicate entry (same `habit_id` + `date`) replaces the existing one via `upsert`
- Deleting an entry (unchecking a habit) deletes the row entirely, cascading to any associated note

**RLS Policy**:
```sql
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entries"
  ON public.daily_entries FOR ALL USING (auth.uid() = user_id);
```

---

## Entity: Note

An optional rich attachment on a daily entry (text, audio, or video).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| entry_id | uuid | FK → daily_entries, NOT NULL, ON DELETE CASCADE | |
| user_id | uuid | FK → auth.users, NOT NULL, ON DELETE CASCADE | Denormalized for RLS and storage path |
| type | text | NOT NULL, CHECK IN ('text', 'audio', 'video') | Note type |
| content | text | nullable | Populated for type='text' |
| storage_path | text | nullable | Populated for type='audio' or 'video' |
| duration_sec | integer | nullable, CHECK > 0 | Audio/video length in seconds |
| created_at | timestamptz | NOT NULL, default now() | |

**Validation rules**:
- `type = 'text'` → `content` must be non-null and non-empty; `storage_path` must be null
- `type = 'audio'` → `storage_path` must be non-null; `duration_sec` ≤ 60; `content` must be null
- `type = 'video'` → `storage_path` must be non-null; `duration_sec` ≤ 30; `content` must be null
- Only one note per entry (enforced via unique constraint on `entry_id`)
- `storage_path` format: `{user_id}/{entry_id}.{webm|mp4}`

**Unique constraint**: `(entry_id)` — one note per daily entry.

**Supabase Storage bucket**: `notes` (private bucket, accessed via signed URLs)

**RLS Policy**:
```sql
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes"
  ON public.notes FOR ALL USING (auth.uid() = user_id);
```

---

## Entity: PushSubscription

Stores a user's Web Push API subscription for server-side notifications.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK → auth.users, NOT NULL, ON DELETE CASCADE | |
| endpoint | text | NOT NULL | Push service URL |
| p256dh | text | NOT NULL | Encryption key (base64url) |
| auth | text | NOT NULL | Auth secret (base64url) |
| timezone | text | NOT NULL, default 'UTC' | IANA timezone string e.g. 'America/New_York' |
| created_at | timestamptz | NOT NULL, default now() | |

**Unique constraint**: `(user_id, endpoint)` — one subscription per device per user.

**RLS Policy**:
```sql
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions"
  ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
```

---

## Entity: UserPreferences

Stores per-user app settings.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| user_id | uuid | PK, FK → auth.users, ON DELETE CASCADE | |
| notifications_enabled | boolean | NOT NULL, default true | Master notification toggle |
| timezone | text | NOT NULL, default 'UTC' | IANA timezone, synced from device |

**RLS Policy**:
```sql
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences"
  ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
```

---

## Derived: Streak

Not stored in the database. Computed client-side from `daily_entries`.

**Inputs**: Sorted array of `date` strings for a specific habit.
**Output**: Integer — count of consecutive days ending on today (or yesterday if today is not yet in the array).

**State transitions**:
- Streak = 0: No completions, or last completion was 2+ days ago
- Streak = 1..2: Completing (not yet reward-worthy)
- Streak ≥ 3: Reward state — show celebration
- 2-day miss: Today AND yesterday both absent from entries → show nudge

**Algorithm**:
```js
function calculateStreak(dateStrings, todayStr) {
  const sorted = [...new Set(dateStrings)].sort().reverse() // newest first
  if (sorted.length === 0) return 0
  let streak = 0
  let cursor = todayStr
  for (const d of sorted) {
    if (d === cursor) {
      streak++
      cursor = prevDay(cursor)
    } else if (d === prevDay(cursor)) {
      // yesterday counts even if today not done yet
      streak++
      cursor = prevDay(d)
    } else break
  }
  return streak
}
```

---

## Complete SQL Migration

```sql
-- 001_initial_schema.sql

-- Habits
CREATE TABLE public.habits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text CHECK (char_length(description) <= 500),
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_habit_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM public.habits WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 habits per user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_habit_limit
  BEFORE INSERT ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.check_habit_limit();

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits"
  ON public.habits FOR ALL USING (auth.uid() = user_id);

-- Daily Entries
CREATE TABLE public.daily_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id     uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date         date NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entries"
  ON public.daily_entries FOR ALL USING (auth.uid() = user_id);

-- Notes
CREATE TABLE public.notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid NOT NULL REFERENCES public.daily_entries(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('text', 'audio', 'video')),
  content      text,
  storage_path text,
  duration_sec integer CHECK (duration_sec > 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id)
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes"
  ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Push Subscriptions
CREATE TABLE public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  timezone   text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions"
  ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- User Preferences
CREATE TABLE public.user_preferences (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled  boolean NOT NULL DEFAULT true,
  timezone               text NOT NULL DEFAULT 'UTC'
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences"
  ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Helper RPC: get push subscriptions where local hour = target_hour
CREATE OR REPLACE FUNCTION public.get_subscriptions_for_hour(target_hour integer)
RETURNS SETOF public.push_subscriptions
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT *
  FROM public.push_subscriptions
  WHERE extract(hour FROM (now() AT TIME ZONE timezone)) = target_hour;
$$;
```
