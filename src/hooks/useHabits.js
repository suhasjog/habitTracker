import { useState, useCallback } from 'react'
import { getHabits, saveHabits, getCompletions, saveCompletions, getTodayKey } from '../utils/storage'

export function useHabits() {
  const [habits, setHabits] = useState(getHabits)
  const [completions, setCompletions] = useState(getCompletions)

  const addHabit = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const newHabit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: getTodayKey(),
    }
    const updated = [...getHabits(), newHabit]
    saveHabits(updated)
    setHabits(updated)
  }, [])

  const deleteHabit = useCallback((id) => {
    const updated = getHabits().filter((h) => h.id !== id)
    saveHabits(updated)
    setHabits(updated)
  }, [])

  const toggleCompletion = useCallback((habitId) => {
    const today = getTodayKey()
    const all = getCompletions()
    const todayList = all[today] || []
    if (todayList.includes(habitId)) {
      all[today] = todayList.filter((id) => id !== habitId)
    } else {
      all[today] = [...todayList, habitId]
    }
    saveCompletions(all)
    setCompletions({ ...all })
  }, [])

  const todayKey = getTodayKey()
  const todayCompletions = completions[todayKey] || []
  const completedCount = todayCompletions.length
  const totalCount = habits.length
  const incompleteHabits = habits.filter((h) => !todayCompletions.includes(h.id))

  return {
    habits,
    todayCompletions,
    completedCount,
    totalCount,
    incompleteHabits,
    addHabit,
    deleteHabit,
    toggleCompletion,
  }
}
