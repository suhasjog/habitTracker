const HABITS_KEY = 'habits'
const COMPLETIONS_KEY = 'completions'

export function getHabits() {
  const data = localStorage.getItem(HABITS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits))
}

export function getCompletions() {
  const data = localStorage.getItem(COMPLETIONS_KEY)
  return data ? JSON.parse(data) : {}
}

export function saveCompletions(completions) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions))
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}
