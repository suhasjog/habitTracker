-- 003_habit_theming.sql
-- Run in Supabase SQL Editor.
-- Adds per-habit color theme and icon fields.

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT 'violet',
  ADD COLUMN IF NOT EXISTS icon  text NOT NULL DEFAULT '⭐';
