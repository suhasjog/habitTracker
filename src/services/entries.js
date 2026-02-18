import { supabase } from './supabase'

export async function getEntries(userId, habitIds, startDate, endDate) {
  if (!habitIds || habitIds.length === 0) return []
  const { data, error } = await supabase
    .from('daily_entries')
    .select('id, habit_id, date, completed_at')
    .in('habit_id', habitIds)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function markComplete(userId, habitId, date) {
  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      { habit_id: habitId, date, user_id: userId, completed_at: new Date().toISOString() },
      { onConflict: 'habit_id,date' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unmarkComplete(habitId, date) {
  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
  if (error) throw error
}
