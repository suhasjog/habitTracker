import HabitItem from './HabitItem'

export default function HabitList({ habits, todayCompletions, onToggle, onDelete }) {
  if (habits.length === 0) {
    return <p className="empty-state">No habits yet. Add one above!</p>
  }

  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          completed={todayCompletions.includes(habit.id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
