export default function HabitItem({ habit, completed, onToggle, onDelete }) {
  return (
    <div className={`habit-item ${completed ? 'completed' : ''}`}>
      <label className="habit-label">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(habit.id)}
        />
        <span className="checkmark" />
        <span className="habit-name">{habit.name}</span>
      </label>
      <button
        className="delete-btn"
        onClick={() => onDelete(habit.id)}
        aria-label={`Delete ${habit.name}`}
      >
        &times;
      </button>
    </div>
  )
}
