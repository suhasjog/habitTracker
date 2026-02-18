import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../App'
import { getEntries, markComplete, unmarkComplete } from '../services/entries'
import { localDate } from '../utils/dates'

const ENTRIES_CACHE_KEY = 'ht_entries_today'
const PENDING_QUEUE_KEY = 'ht_pending_toggles'

function readCachedEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCachedEntries(entries) {
  try { localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(entries)) } catch {}
}

function readPendingQueue() {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writePendingQueue(queue) {
  try { localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue)) } catch {}
}

export function useEntries(habitIds = [], startDate = null, endDate = null) {
  const { user } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const today = localDate()
  const start = startDate || today
  const end = endDate || today

  const cached = readCachedEntries()
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  const { data: entries = cached || [], isLoading, error } = useQuery({
    queryKey: ['entries', user?.id, habitIds.join(','), start, end],
    queryFn: async () => {
      const data = await getEntries(user.id, habitIds, start, end)
      // Cache today's entries for offline use
      if (start === today && end === today) writeCachedEntries(data)
      return data
    },
    enabled: Boolean(user) && habitIds.length > 0 && !isOffline,
    initialData: isOffline && cached ? cached : undefined,
  })

  // Replay pending offline mutations when we come back online
  useEffect(() => {
    function handleOnline() {
      const queue = readPendingQueue()
      if (queue.length === 0) return
      writePendingQueue([])
      queue.forEach(({ habitId, action }) => {
        if (action === 'mark') markComplete(user.id, habitId, today).catch(() => {})
        else unmarkComplete(habitId, today).catch(() => {})
      })
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user?.id, today, queryClient])

  const todayEntries = entries.filter(e => e.date === today)
  const entryByHabitId = Object.fromEntries(todayEntries.map(e => [e.habit_id, e]))

  const toggleMutation = useMutation({
    mutationFn: async (habitId) => {
      if (!navigator.onLine) {
        // Queue for later
        const queue = readPendingQueue()
        const existing = entryByHabitId[habitId]
        queue.push({ habitId, action: existing ? 'unmark' : 'mark' })
        writePendingQueue(queue)
        return existing ? null : { id: `offline-${habitId}`, habit_id: habitId, date: today }
      }
      const existing = entryByHabitId[habitId]
      if (existing) {
        await unmarkComplete(habitId, today)
        return null
      } else {
        return markComplete(user.id, habitId, today)
      }
    },
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['entries'] })
      const previousData = queryClient.getQueriesData({ queryKey: ['entries'] })

      queryClient.setQueriesData({ queryKey: ['entries'] }, (old) => {
        if (!old) return old
        const existing = old.find(e => e.habit_id === habitId && e.date === today)
        if (existing) {
          return old.filter(e => !(e.habit_id === habitId && e.date === today))
        } else {
          return [...old, {
            id: `optimistic-${habitId}`,
            habit_id: habitId,
            date: today,
            completed_at: new Date().toISOString(),
          }]
        }
      })
      return { previousData }
    },
    onError: (_err, _habitId, context) => {
      context?.previousData?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      if (navigator.onLine) queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  function isCompleted(habitId) {
    return Boolean(entryByHabitId[habitId])
  }

  // Marks a habit complete with optimistic update; returns the real DB entry (for notes)
  async function markHabit(habitId) {
    await queryClient.cancelQueries({ queryKey: ['entries'] })
    const previousData = queryClient.getQueriesData({ queryKey: ['entries'] })
    queryClient.setQueriesData({ queryKey: ['entries'] }, (old) => {
      if (!old) return old
      return [...old, {
        id: `optimistic-${habitId}`,
        habit_id: habitId,
        date: today,
        completed_at: new Date().toISOString(),
      }]
    })
    try {
      const entry = await markComplete(user.id, habitId, today)
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      return entry
    } catch (err) {
      previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      throw err
    }
  }

  return {
    entries,
    todayEntries,
    entryByHabitId,
    isLoading,
    error,
    isCompleted,
    toggleCompletion: (habitId) => toggleMutation.mutate(habitId),
    markHabit,
  }
}
