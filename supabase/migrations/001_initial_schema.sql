-- 001_initial_schema.sql
-- Run this in the Supabase SQL Editor to set up the full schema.

-- ============================================================
-- Habits
-- ============================================================
CREATE TABLE public.habits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text CHECK (char_length(description) <= 500),
  position    bigint NOT NULL DEFAULT 0,
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

-- ============================================================
-- Daily Entries
-- ============================================================
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

-- ============================================================
-- Notes
-- ============================================================
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

-- ============================================================
-- Push Subscriptions
-- ============================================================
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

-- ============================================================
-- User Preferences
-- ============================================================
CREATE TABLE public.user_preferences (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled  boolean NOT NULL DEFAULT true,
  timezone               text NOT NULL DEFAULT 'UTC'
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences"
  ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Helper RPC: get push subscriptions where local hour = target_hour
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_subscriptions_for_hour(target_hour integer)
RETURNS SETOF public.push_subscriptions
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT *
  FROM public.push_subscriptions
  WHERE extract(hour FROM (now() AT TIME ZONE timezone)) = target_hour;
$$;
