import { supabase } from './supabase'

export async function getNote(entryId) {
  const { data, error } = await supabase
    .from('notes')
    .select('id, type, content, storage_path, duration_sec, created_at')
    .eq('entry_id', entryId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createTextNote(entryId, userId, content) {
  const { data, error } = await supabase
    .from('notes')
    .insert({ entry_id: entryId, user_id: userId, type: 'text', content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createMediaNote(entryId, userId, type, blob, durationSec) {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const path = `${userId}/${entryId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('notes')
    .upload(path, blob, { contentType: blob.type, upsert: true })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('notes')
    .insert({
      entry_id: entryId,
      user_id: userId,
      type,
      storage_path: path,
      duration_sec: Math.round(durationSec) || null,
    })
    .select()
    .single()
  if (error) {
    // Clean up uploaded file on DB insert failure
    await supabase.storage.from('notes').remove([path])
    throw error
  }
  return data
}

export async function deleteNote(noteId, storagePath) {
  if (storagePath) {
    await supabase.storage.from('notes').remove([storagePath])
  }
  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}

export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('notes')
    .createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}
