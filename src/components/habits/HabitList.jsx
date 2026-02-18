import HabitCard from './HabitCard'
import EmptyState from '../ui/EmptyState'

export default function HabitList({
  habits,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  streakMap = {},
  entryMap = {},
  showEditDelete = false,  // show ✏️🗑️ (Settings page)
  showNoteIcon = false,    // show note icon on completed cards (Home page)
  emptyIcon = '🌱',
  emptyTitle = 'No habits yet',
  emptyMessage = 'Add your first habit to get started',
  emptyActionLabel,
  onEmptyAction,
}) {
  if (!habits || habits.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    )
  }

  return (
    <div className="habit-list">
      {habits.map(habit => {
        const streakData = streakMap[habit.id] || {}
        return (
          <HabitCard
            key={habit.id}
            habit={habit}
            isCompleted={isCompleted ? isCompleted(habit.id) : false}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            streak={streakData.streak || 0}
            isReward={streakData.isReward || false}
            entry={entryMap[habit.id]}
            showEditDelete={showEditDelete}
            showNoteIcon={showNoteIcon}
          />
        )
      })}
    </div>
  )
}
