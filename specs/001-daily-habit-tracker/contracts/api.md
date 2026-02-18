# API Contracts: Daily Habit Tracker

**Branch**: `001-daily-habit-tracker`
**Date**: 2026-02-17
**Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

All data access uses the **Supabase JS client v2**. There is no custom REST API — the frontend calls Supabase directly. RLS policies on each table enforce authorization automatically.

---

## Auth Contracts

### Sign Up
```js
// Input
{ email: string, password: string }  // password min 8 chars

// Call
const { data, error } = await supabase.auth.signUp({ email, password })

// Success response
data.user: { id: uuid, email: string }
data.session: { access_token: string, ... }

// Error codes
'email_address_invalid'       // malformed email
'weak_password'               // < 8 chars
'email_already_in_use'        // duplicate account
```

### Sign In
```js
// Input
{ email: string, password: string }

// Call
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Success response
data.user: { id: uuid, email: string }
data.session: Session

// Error codes
'invalid_credentials'         // wrong email or password
```

### Sign Out
```js
await supabase.auth.signOut()
// Always succeeds (clears local session)
```

### Auth State Listener
```js
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'
  // session: Session | null
})
```

---

## Habit Contracts

### List Habits (for authenticated user)
```js
// Call
const { data, error } = await supabase
  .from('habits')
  .select('id, name, description, position, created_at')
  .order('position', { ascending: true })

// Response: Habit[]
Habit {
  id: uuid
  name: string
  description: string | null
  position: number
  created_at: string (ISO 8601)
}

// Errors
'PGRST116': no rows (returns empty array, not error)
```

### Create Habit
```js
// Input
{ name: string, description?: string }

// Call
const { data, error } = await supabase
  .from('habits')
  .insert({ name, description, user_id: user.id, position: habits.length })
  .select()
  .single()

// Success: Habit object
// Errors
'23514': check constraint violated (name too long)
'P0001': trigger error "Maximum of 10 habits per user"
```

### Update Habit
```js
// Input
{ id: uuid, name?: string, description?: string }

// Call
const { data, error } = await supabase
  .from('habits')
  .update({ name, description, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single()

// Success: updated Habit object
```

### Delete Habit
```js
// Input
{ id: uuid }

// Call
const { error } = await supabase
  .from('habits')
  .delete()
  .eq('id', id)

// Success: no error, cascades to daily_entries and notes
```

---

## Daily Entry Contracts

### List Entries for Date Range
```js
// Input
{ habitIds: uuid[], startDate: string, endDate: string }  // dates as 'YYYY-MM-DD'

// Call
const { data, error } = await supabase
  .from('daily_entries')
  .select('id, habit_id, date, completed_at')
  .in('habit_id', habitIds)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: true })

// Response: DailyEntry[]
DailyEntry {
  id: uuid
  habit_id: uuid
  date: string  // 'YYYY-MM-DD'
  completed_at: string  // ISO 8601
}
```

### Mark Habit Complete (upsert)
```js
// Input
{ habitId: uuid, date: string }  // date = today in user's local timezone

// Call
const { data, error } = await supabase
  .from('daily_entries')
  .upsert(
    { habit_id: habitId, date, user_id: user.id, completed_at: new Date().toISOString() },
    { onConflict: 'habit_id,date' }
  )
  .select()
  .single()

// Success: DailyEntry object
```

### Unmark Habit Complete
```js
// Input
{ habitId: uuid, date: string }

// Call
const { error } = await supabase
  .from('daily_entries')
  .delete()
  .eq('habit_id', habitId)
  .eq('date', date)

// Success: no error, cascades to note if present
```

---

## Note Contracts

### Get Note for Entry
```js
// Input
{ entryId: uuid }

// Call
const { data, error } = await supabase
  .from('notes')
  .select('id, type, content, storage_path, duration_sec, created_at')
  .eq('entry_id', entryId)
  .maybeSingle()

// Response: Note | null
Note {
  id: uuid
  type: 'text' | 'audio' | 'video'
  content: string | null        // set for type='text'
  storage_path: string | null   // set for type='audio' | 'video'
  duration_sec: number | null
  created_at: string
}
```

### Create Text Note
```js
// Input
{ entryId: uuid, content: string }

// Call
const { data, error } = await supabase
  .from('notes')
  .insert({ entry_id: entryId, user_id: user.id, type: 'text', content })
  .select()
  .single()

// Success: Note object
// Errors
'23505': unique violation (note already exists for this entry — delete first)
```

### Create Audio/Video Note
```js
// Step 1: Upload Blob to Supabase Storage
const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
const path = `${user.id}/${entryId}.${ext}`

const { error: uploadError } = await supabase.storage
  .from('notes')
  .upload(path, blob, { contentType: mimeType, upsert: true })

// Step 2: Insert note record
const { data, error } = await supabase
  .from('notes')
  .insert({
    entry_id: entryId,
    user_id: user.id,
    type: mimeType.startsWith('audio') ? 'audio' : 'video',
    storage_path: path,
    duration_sec: durationInSeconds
  })
  .select()
  .single()

// Success: Note object with storage_path set
```

### Get Signed URL for Media Note
```js
// Input
{ storagePath: string }

// Call (signed URL valid for 1 hour)
const { data, error } = await supabase.storage
  .from('notes')
  .createSignedUrl(storagePath, 3600)

// Response
data.signedUrl: string  // use as <audio src> or <video src>
```

### Delete Note
```js
// Input
{ noteId: uuid, storagePath?: string }

// Step 1: Delete storage file if media note
if (storagePath) {
  await supabase.storage.from('notes').remove([storagePath])
}

// Step 2: Delete DB record
await supabase.from('notes').delete().eq('id', noteId)
```

---

## Push Subscription Contracts

### Save Push Subscription
```js
// Input: PushSubscription from browser's pushManager.subscribe()
const sub = pushSubscription.toJSON()

// Call (upsert to handle re-subscribes on same device)
const { error } = await supabase
  .from('push_subscriptions')
  .upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    { onConflict: 'user_id,endpoint' }
  )
```

### Delete Push Subscription (opt-out)
```js
const { error } = await supabase
  .from('push_subscriptions')
  .delete()
  .eq('user_id', user.id)
  // Optionally filter by endpoint to delete only current device
```

---

## User Preferences Contracts

### Get Preferences
```js
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle()

// null = preferences not yet created (use defaults)
```

### Upsert Preferences
```js
const { error } = await supabase
  .from('user_preferences')
  .upsert({ user_id: user.id, notifications_enabled, timezone })
```

---

## Edge Function Contract: send-habit-reminders

**Trigger**: Supabase `pg_cron` — every hour at :00 (`0 * * * *`)
**Function path**: `supabase/functions/send-habit-reminders/index.ts`
**Auth**: Service role key (not exposed to client)

**Execution flow**:
1. Call `get_subscriptions_for_hour(22)` RPC → subscriptions where local hour = 10PM
2. For each subscription, compute user's local `today` date using their `timezone`
3. Query `daily_entries` for that user's habits on `today`
4. Compute incomplete habits (habits without a daily_entry for today)
5. If any incomplete: call `webpush.sendNotification(subscription, payload)`
6. On `404` or `410` from push service: delete the subscription row

**Push payload**:
```json
{
  "title": "Habit Tracker",
  "body": "2 habits left today: Yoga, Meditation",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/icon-192.png",
  "tag": "habit-reminder"
}
```

**Environment variables** (Supabase secrets):
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (e.g. `mailto:admin@example.com`)
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

---

## Client Environment Variables

Set in Netlify dashboard and `.env.local` for development:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```
