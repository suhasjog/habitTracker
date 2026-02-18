import { localDate, dateRange } from '../../utils/dates'

function getLast365Days() {
  const today = localDate()
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() - 364)
  return { start: d.toLocaleDateString('en-CA'), end: today }
}

function getMonthsForYear() {
  const today = new Date()
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(), // 0-indexed
    })
  }
  return months
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export default function YearlyView({ habits, entries }) {
  const completedSet = new Set(entries.map(e => `${e.habit_id}|${e.date}`))
  const months = getMonthsForYear()
  const today = localDate()
  const todayDate = new Date()

  return (
    <div className="dashboard-view">
      {habits.map(habit => (
        <div key={habit.id} className="habit-row">
          <div className="habit-row-header">
            <span className="habit-row-name">{habit.name}</span>
          </div>
          <div className="month-row">
            {months.map(({ label, year, month }) => {
              const daysInMonth = getDaysInMonth(year, month)
              // Only count days up to today
              const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth()
              const maxDay = isCurrentMonth ? todayDate.getDate() : daysInMonth
              let completed = 0
              for (let d = 1; d <= maxDay; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                if (completedSet.has(`${habit.id}|${dateStr}`)) completed++
              }
              const rate = maxDay > 0 ? completed / maxDay : 0
              const level = rate >= 0.7 ? 'high' : rate >= 0.3 ? 'med' : rate > 0 ? 'low' : ''
              const pct = Math.round(rate * 100)

              return (
                <div key={`${year}-${month}`} className="month-col">
                  <span className="month-label">{label}</span>
                  <div
                    className={`month-cell${level ? ` ${level}` : ''}`}
                    title={`${label} ${year}: ${completed}/${maxDay} days (${pct}%)`}
                  >
                    {pct > 0 ? `${pct}%` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
