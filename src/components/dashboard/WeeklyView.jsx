import { localDate, dateRange, prevDay } from '../../utils/dates'

function getLast7Days() {
  const today = localDate()
  const start = (() => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - 6)
    return d.toLocaleDateString('en-CA')
  })()
  return dateRange(start, today)
}

const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function WeeklyView({ habits, entries }) {
  const days = getLast7Days()
  const today = localDate()

  // Build a set of "habitId|date" for O(1) lookup
  const completedSet = new Set(entries.map(e => `${e.habit_id}|${e.date}`))

  return (
    <div className="dashboard-view">
      {habits.map(habit => {
        const completedDays = days.filter(d => completedSet.has(`${habit.id}|${d}`)).length
        return (
          <div key={habit.id} className="habit-row">
            <div className="habit-row-header">
              <span className="habit-row-name">{habit.name}</span>
              <span className="completion-pct">{completedDays}/7</span>
            </div>
            <div className="day-grid">
              {days.map(day => {
                const done = completedSet.has(`${habit.id}|${day}`)
                const isToday = day === today
                const dow = new Date(day + 'T00:00:00').getDay()
                return (
                  <div key={day} className="day-col">
                    <span className="day-label">{DAY_SHORT[dow]}</span>
                    <div
                      className={`day-cell${done ? ' completed' : ''}${isToday ? ' today' : ''}`}
                      title={day}
                    >
                      {done ? '✓' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
