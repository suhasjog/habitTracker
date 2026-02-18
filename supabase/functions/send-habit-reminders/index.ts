import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

serve(async (_req) => {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get all subscriptions where local hour is 10PM (22)
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_subscriptions_for_hour', { target_hour: 22 })

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions at this hour' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    const staleEndpoints: string[] = []

    for (const sub of subscriptions) {
      try {
        // Compute user's local "today" date using their timezone
        const todayStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: sub.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date())

        // Get user's habits
        const { data: habits } = await supabase
          .from('habits')
          .select('id, name')
          .eq('user_id', sub.user_id)

        if (!habits || habits.length === 0) continue

        // Get today's completed entries
        const { data: entries } = await supabase
          .from('daily_entries')
          .select('habit_id')
          .eq('user_id', sub.user_id)
          .eq('date', todayStr)

        const completedIds = new Set((entries || []).map((e: { habit_id: string }) => e.habit_id))
        const incompleteHabits = habits.filter((h: { id: string; name: string }) => !completedIds.has(h.id))

        if (incompleteHabits.length === 0) continue

        const habitNames = incompleteHabits.map((h: { name: string }) => h.name).join(', ')
        const payload = JSON.stringify({
          title: 'Habit Tracker',
          body: `${incompleteHabits.length} habit${incompleteHabits.length > 1 ? 's' : ''} left today: ${habitNames}`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'habit-reminder',
        })

        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }

        await webpush.sendNotification(pushSub, payload)
        sent++
      } catch (pushErr: any) {
        // If subscription is stale (410 Gone or 404 Not Found), remove it
        if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
          staleEndpoints.push(sub.endpoint)
        }
        console.error('Push failed for sub', sub.id, pushErr?.message)
      }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints)
    }

    return new Response(
      JSON.stringify({ sent, stale_removed: staleEndpoints.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
