import { useMemo } from 'react'
import { calculateStreak, isMissStreak, isStreakReward } from '../utils/streaks'
import { localDate } from '../utils/dates'

export function useStreaks(habits, entries) {
  const today = localDate()

  return useMemo(() => {
    const map = {}
    for (const habit of habits) {
      const habitDates = entries
        .filter(e => e.habit_id === habit.id)
        .map(e => e.date)
      const streak = calculateStreak(habitDates, today)
      map[habit.id] = {
        streak,
        isReward: isStreakReward(streak),
        isMissing: isMissStreak(habitDates, today),
      }
    }
    return map
  }, [habits, entries, today])
}
