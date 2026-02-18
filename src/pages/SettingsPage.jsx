import { useState, useContext } from 'react'
import { AuthContext } from '../App'
import { useHabits } from '../hooks/useHabits'
import { useNotification } from '../hooks/useNotification'
import HabitList from '../components/habits/HabitList'
import HabitForm from '../components/habits/HabitForm'

export default function SettingsPage() {
  const { user, signOut } = useContext(AuthContext)
  const { habits, isLoading, atLimit, addHabit, editHabit, removeHabit } = useHabits()
  const { permission, notificationsEnabled, requestPermission, revokePermission } = useNotification()
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd({ name, description, color, icon }) {
    setError('')
    await addHabit(name, description, color, icon)
    setShowAddForm(false)
  }

  async function handleEdit(id, name, description, color, icon) {
    await editHabit(id, name, description, color, icon)
  }

  async function handleDelete(id) {
    await removeHabit(id)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">{user?.email}</p>
      </div>

      {/* Habits section */}
      <div className="settings-section">
        <div className="settings-section-header">
          <span className="settings-section-title">
            My Habits
            <span className="habit-count-badge">{habits.length}/10</span>
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddForm(true)}
            disabled={atLimit}
            title={atLimit ? 'Maximum of 10 habits reached' : 'Add a new habit'}
          >
            + Add Habit
          </button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {isLoading ? (
          <>
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </>
        ) : (
          <HabitList
            showEditDelete={true}
            habits={habits}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            emptyTitle="No habits yet"
            emptyMessage="Add your first habit to start tracking"
            emptyActionLabel="Add Habit"
            onEmptyAction={() => !atLimit && setShowAddForm(true)}
          />
        )}
      </div>

      {/* Notifications section */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ marginBottom: 12 }}>Notifications</div>

        {permission === 'denied' ? (
          <div className="notification-row">
            <div>
              <div className="notification-label">Reminders blocked</div>
              <div className="notification-hint">Enable notifications in your browser settings to receive 10PM reminders.</div>
            </div>
          </div>
        ) : permission === 'granted' && notificationsEnabled ? (
          <div className="notification-row">
            <div>
              <div className="notification-label">10PM reminders enabled ✅</div>
              <div className="notification-hint">You'll get a push notification for any incomplete habits.</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={revokePermission}>Turn off</button>
          </div>
        ) : (
          <div className="notification-row">
            <div>
              <div className="notification-label">Enable 10PM reminders</div>
              <div className="notification-hint">Get a push notification if you haven't completed all habits by 10PM.</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={requestPermission}>Enable</button>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="settings-section">
        <button className="btn btn-danger" onClick={signOut} style={{ width: '100%' }}>
          Sign Out
        </button>
      </div>

      {showAddForm && (
        <HabitForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
