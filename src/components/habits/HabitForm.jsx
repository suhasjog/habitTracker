import { useState } from 'react'
import { HABIT_COLORS, COLOR_KEYS } from '../../utils/habitColors'

export default function HabitForm({ initialValues = {}, onSave, onCancel }) {
  const [name, setName] = useState(initialValues.name || '')
  const [description, setDescription] = useState(initialValues.description || '')
  const [icon, setIcon] = useState(initialValues.icon || '⭐')
  const [color, setColor] = useState(initialValues.color || 'violet')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = Boolean(initialValues.id)
  const nameRemaining = 100 - name.length
  const descRemaining = 500 - description.length

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)
    try {
      await onSave({ name: name.trim(), description: description.trim(), color, icon })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-sheet">
        <h2 className="modal-title">{isEdit ? 'Edit Habit' : 'Add Habit'}</h2>
        <form onSubmit={handleSubmit}>

          {/* Icon + Name row */}
          <div className="habit-icon-name-row">
            <div className="form-group" style={{ flex: '0 0 72px' }}>
              <label htmlFor="habit-icon">Icon</label>
              <input
                id="habit-icon"
                type="text"
                value={icon}
                onChange={e => {
                  // Keep only the last typed character (emoji-friendly)
                  const val = e.target.value
                  if (val) setIcon([...val].pop())
                }}
                className="icon-input"
                placeholder="⭐"
                maxLength={8}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="habit-name">Name</label>
              <input
                id="habit-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                required
                autoFocus
                placeholder="e.g. Morning yoga"
              />
              <span className="form-hint">{nameRemaining} chars left</span>
            </div>
          </div>

          {/* Color picker */}
          <div className="form-group">
            <label>Color</label>
            <div className="color-swatches">
              {COLOR_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  className={`color-swatch${color === key ? ' selected' : ''}`}
                  style={{ background: HABIT_COLORS[key].accent }}
                  onClick={() => setColor(key)}
                  aria-label={key}
                  title={key}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="habit-desc">
              Description{' '}
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span>
            </label>
            <textarea
              id="habit-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Why does this habit matter to you?"
            />
            <span className="form-hint">{descRemaining} chars left</span>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
