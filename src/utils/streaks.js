import { prevDay } from './dates'

export function calculateStreak(dateStrings, todayStr) {
  const sorted = [...new Set(dateStrings)].sort().reverse() // newest first
  if (sorted.length === 0) return 0
  let streak = 0
  let cursor = todayStr
  for (const d of sorted) {
    if (d === cursor) {
      streak++
      cursor = prevDay(cursor)
    } else if (d === prevDay(cursor)) {
      // yesterday counts even if today not done yet
      streak++
      cursor = prevDay(d)
    } else {
      break
    }
  }
  return streak
}

export function isMissStreak(dateStrings, todayStr) {
  const set = new Set(dateStrings)
  const yesterday = prevDay(todayStr)
  return !set.has(todayStr) && !set.has(yesterday)
}

export function isStreakReward(streak) {
  return streak >= 3
}
