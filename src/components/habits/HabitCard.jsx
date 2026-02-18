import { useState, useContext } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import HabitForm from './HabitForm'
import StreakBadge from '../ui/StreakBadge'
import NoteRecorder from '../checkin/NoteRecorder'
import NoteViewer from '../checkin/NoteViewer'
import { getNote } from '../../services/notes'
import { getHabitColor } from '../../utils/habitColors'
import { AuthContext } from '../../App'

export default function HabitCard({
  habit,
  isCompleted = false,
  onToggle,           // called when tapping the check (home page uses its own handler)
  onEdit,
  onDelete,
  streak = 0,
  isReward = false,
  entry,              // today's entry object { id, habit_id, date }
  showEditDelete = false,  // show edit/delete icons (Settings page)
  showNoteIcon = false,    // show note icon (Home page, completed entries)
}) {
  const { user } = useContext(AuthContext)
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showNoteRecorder, setShowNoteRecorder] = useState(false)
  const [showNoteViewer, setShowNoteViewer] = useState(false)

  const theme = getHabitColor(habit.color || 'violet')

  const { data: note, refetch: refetchNote } = useQuery({
    queryKey: ['note', entry?.id],
    queryFn: () => getNote(entry.id),
    enabled: Boolean(showNoteIcon && isCompleted && entry?.id && !entry.id.startsWith('optimistic-')),
    staleTime: 1000 * 60 * 10,
  })

  async function handleSave({ name, description, color, icon }) {
    await onEdit(habit.id, name, description, color, icon)
    setShowForm(false)
  }

  async function handleDelete() {
    await onDelete(habit.id)
    setShowConfirm(false)
  }

  function handleNoteIconClick() {
    if (note) setShowNoteViewer(true)
    else setShowNoteRecorder(true)
  }

  function handleNoteSaved() {
    setShowNoteRecorder(false)
    refetchNote()
    queryClient.invalidateQueries({ queryKey: ['note', entry?.id] })
  }

  function handleNoteDeleted() {
    setShowNoteViewer(false)
    refetchNote()
    queryClient.invalidateQueries({ queryKey: ['note', entry?.id] })
  }

  const cardStyle = isCompleted
    ? {}  // completed: use CSS class background
    : { background: theme.gradient, borderColor: theme.border }

  return (
    <>
      <div
        className={`habit-card${isCompleted ? ' completed' : ''}`}
        style={cardStyle}
      >
        {/* Habit icon bubble */}
        <div
          className="habit-icon-bubble"
          style={isCompleted ? {} : { background: theme.accent + '22', color: theme.accent }}
        >
          {isCompleted ? <span style={{ color: 'var(--color-success)', fontSize: 18 }}>✓</span> : habit.icon || '⭐'}
        </div>

        {/* Toggle checkbox */}
        {onToggle && (
          <button
            className={`habit-check${isCompleted ? ' checked' : ''}`}
            style={isCompleted ? {} : { borderColor: theme.accent }}
            onClick={() => onToggle(habit.id)}
            aria-label={isCompleted ? `Unmark ${habit.name}` : `Mark ${habit.name} as done`}
          />
        )}

        <div className="habit-info">
          <div className="habit-name" style={isCompleted ? {} : { color: theme.accent.replace('ff', 'dd') }}>
            {habit.name}
          </div>
          {habit.description && (
            <div className="habit-description">{habit.description}</div>
          )}
          <div className="habit-meta">
            {streak > 0 && <StreakBadge streak={streak} isReward={isReward} />}
          </div>
        </div>

        <div className="habit-actions">
          {/* Note icon — home page, completed habits only */}
          {showNoteIcon && isCompleted && entry?.id && !entry.id.startsWith('optimistic-') && (
            <button
              className="btn-icon"
              onClick={handleNoteIconClick}
              aria-label={note ? 'View note' : 'Add note'}
              title={note ? 'View note' : 'Add note'}
              style={{ position: 'relative' }}
            >
              {note ? '📝' : '🖊️'}
              {note && <span className="note-indicator" style={{ position: 'absolute', top: 4, right: 4 }} />}
            </button>
          )}

          {/* Delete — visible on home AND settings when onDelete is provided */}
          {onDelete && (
            <button
              className="btn-icon"
              onClick={() => setShowConfirm(true)}
              aria-label={`Delete ${habit.name}`}
              title="Delete habit"
            >
              🗑️
            </button>
          )}

          {/* Edit — settings page only */}
          {showEditDelete && onEdit && (
            <button
              className="btn-icon"
              onClick={() => setShowForm(true)}
              aria-label={`Edit ${habit.name}`}
              title="Edit"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <HabitForm
          initialValues={habit}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showConfirm && (
        <div className="confirm-overlay" onClick={e => e.target === e.currentTarget && setShowConfirm(false)}>
          <div className="confirm-dialog">
            <p>Delete <strong>{habit.name}</strong>? All entries and notes will be removed.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showNoteRecorder && entry?.id && (
        <NoteRecorder
          entryId={entry.id}
          userId={user?.id}
          onSaved={handleNoteSaved}
          onClose={() => setShowNoteRecorder(false)}
        />
      )}

      {showNoteViewer && note && (
        <NoteViewer
          note={note}
          onDeleted={handleNoteDeleted}
          onClose={() => setShowNoteViewer(false)}
        />
      )}
    </>
  )
}
