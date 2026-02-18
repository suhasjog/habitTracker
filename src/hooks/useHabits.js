import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'
import { AuthContext } from '../App'
import { getHabits, createHabit, updateHabit, deleteHabit } from '../services/habits'

const HABITS_CACHE_KEY = 'ht_habits'

function readCachedHabits() {
  try {
    const raw = localStorage.getItem(HABITS_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCachedHabits(habits) {
  try { localStorage.setItem(HABITS_CACHE_KEY, JSON.stringify(habits)) } catch {}
}

export function useHabits() {
  const { user } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  const cached = readCachedHabits()

  const { data: habits = cached || [], isLoading, error } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const data = await getHabits()
      writeCachedHabits(data)
      return data
    },
    enabled: Boolean(user) && !isOffline,
    initialData: isOffline && cached ? cached : undefined,
  })

  const addMutation = useMutation({
    mutationFn: ({ name, description, color, icon }) => createHabit(user.id, name, description, color, icon),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, name, description, color, icon }) => updateHabit(id, name, description, color, icon),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  return {
    habits,
    isLoading,
    error,
    atLimit: habits.length >= 10,
    addHabit: (name, description, color, icon) => addMutation.mutateAsync({ name, description, color, icon }),
    editHabit: (id, name, description, color, icon) => editMutation.mutateAsync({ id, name, description, color, icon }),
    removeHabit: (id) => removeMutation.mutateAsync(id),
    addError: addMutation.error,
    editError: editMutation.error,
    removeError: removeMutation.error,
  }
}
