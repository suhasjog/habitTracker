import { supabase } from './supabase'

export async function getHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select('id, name, description, position, color, icon, created_at')
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

export async function createHabit(userId, name, description, color = 'violet', icon = '⭐') {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      user_id: userId,
      position: Date.now(),
      color,
      icon,
    })
    .select()
    .single()
  if (error) {
    if (error.message?.includes('Maximum of 10 habits')) {
      throw new Error('You have reached the maximum of 10 habits.')
    }
    throw error
  }
  return data
}

export async function updateHabit(id, name, description, color, icon) {
  const { data, error } = await supabase
    .from('habits')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      color,
      icon,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
  if (error) throw error
}
