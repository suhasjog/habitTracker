import { useHabits } from './hooks/useHabits'
import { useNotification } from './hooks/useNotification'
import AddHabit from './components/AddHabit'
import HabitList from './components/HabitList'

export default function App() {
  const {
    habits,
    todayCompletions,
    completedCount,
    totalCount,
    addHabit,
    deleteHabit,
    toggleCompletion,
  } = useHabits()

  const { permission, requestPermission } = useNotification()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="app">
      <header className="header">
        <h1>Habit Tracker</h1>
        <p className="date">{today}</p>
        {totalCount > 0 && (
          <p className="progress">
            {completedCount}/{totalCount} done
            {completedCount === totalCount && totalCount > 0 && ' \u2714'}
          </p>
        )}
      </header>

      {permission === 'default' && (
        <div className="notification-banner">
          <p>Enable reminders to stay on track at 10 PM</p>
          <button onClick={requestPermission}>Enable</button>
        </div>
      )}

      <main>
        <AddHabit onAdd={addHabit} />
        <HabitList
          habits={habits}
          todayCompletions={todayCompletions}
          onToggle={toggleCompletion}
          onDelete={deleteHabit}
        />
      </main>
    </div>
  )
}
