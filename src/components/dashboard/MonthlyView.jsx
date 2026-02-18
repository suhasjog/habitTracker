import { localDate, dateRange } from '../../utils/dates'

function getLast30Days() {
  const today = localDate()
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() - 29)
  const start = d.toLocaleDateString('en-CA')
  return dateRange(start, today)
}

export default function MonthlyView({ habits, entries }) {
  const days = getLast30Days()
  const today = localDate()
  const completedSet = new Set(entries.map(e => `${e.habit_id}|${e.date}`))

  // Group days into rows of 7
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="dashboard-view">
      {habits.map(habit => {
        const completedCount = days.filter(d => completedSet.has(`${habit.id}|${d}`)).length
        return (
          <div key={habit.id} className="habit-row">
            <div className="habit-row-header">
              <span className="habit-row-name">{habit.name}</span>
              <span className="completion-pct">{completedCount}/30</span>
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="day-grid" style={{ marginBottom: 4 }}>
                {week.map(day => {
                  const done = completedSet.has(`${habit.id}|${day}`)
                  const isToday = day === today
                  const dayNum = new Date(day + 'T00:00:00').getDate()
                  return (
                    <div
                      key={day}
                      className={`day-cell${done ? ' completed' : ''}${isToday ? ' today' : ''}`}
                      title={day}
                    >
                      {dayNum}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
