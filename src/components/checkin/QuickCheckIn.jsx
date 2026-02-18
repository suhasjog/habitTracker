import { useState, useRef } from 'react'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'
import { createTextNote, createMediaNote } from '../../services/notes'
import { getHabitColor } from '../../utils/habitColors'

export default function QuickCheckIn({ habit, entry, userId, onClose }) {
  const [mode, setMode] = useState('text')   // 'text' | 'voice'
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const audioRecorder = useMediaRecorder('audio')
  const theme = getHabitColor(habit.color || 'violet')

  const maxTime = 60
  const timeLeft = maxTime - audioRecorder.elapsed
  const isRecording = audioRecorder.state === 'recording'
  const hasBlob = audioRecorder.state === 'stopped' && audioRecorder.blob

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  async function handleSave() {
    if (!entry?.id) return
    setSaving(true)
    setSaveError('')
    try {
      if (mode === 'text') {
        if (text.trim()) await createTextNote(entry.id, userId, text.trim())
      } else if (hasBlob) {
        await createMediaNote(entry.id, userId, 'audio', audioRecorder.blob, audioRecorder.elapsed)
      }
      onClose()
    } catch (err) {
      setSaveError(err.message || 'Failed to save note.')
      setSaving(false)
    }
  }

  const canSave = mode === 'text' ? text.trim().length > 0 : hasBlob

  return (
    <div className="qci-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qci-sheet" style={{ '--habit-accent': theme.accent, '--habit-gradient': theme.gradient }}>

        {/* Habit header */}
        <div className="qci-header" style={{ background: theme.gradient, borderBottom: `2px solid ${theme.border}` }}>
          <span className="qci-icon">{habit.icon || '⭐'}</span>
          <div>
            <div className="qci-habit-name" style={{ color: theme.accent }}>{habit.name}</div>
            <div className="qci-sub">Great job! Add a quick note? (optional)</div>
          </div>
          <button className="btn-icon qci-close" onClick={onClose} aria-label="Skip">✕</button>
        </div>

        {/* Mode toggle */}
        <div className="qci-mode-row">
          <button
            className={`qci-mode-btn${mode === 'text' ? ' active' : ''}`}
            style={mode === 'text' ? { borderColor: theme.accent, color: theme.accent } : {}}
            onClick={() => { audioRecorder.reset(); setMode('text') }}
          >
            📝 Text
          </button>
          <button
            className={`qci-mode-btn${mode === 'voice' ? ' active' : ''}`}
            style={mode === 'voice' ? { borderColor: theme.accent, color: theme.accent } : {}}
            onClick={() => setMode('voice')}
          >
            🎙 Voice
          </button>
        </div>

        {/* Text mode */}
        {mode === 'text' && (
          <div className="form-group" style={{ margin: '0 0 12px' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="How did it feel? Any notes…"
              rows={4}
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>
        )}

        {/* Voice mode */}
        {mode === 'voice' && (
          <div className="recording-area">
            {audioRecorder.state === 'error' && (
              <p className="note-error">{audioRecorder.errorMsg}</p>
            )}

            {(audioRecorder.state === 'idle' || audioRecorder.state === 'requesting' || isRecording) && audioRecorder.state !== 'error' && (
              <>
                <div className="recording-timer" style={{ color: isRecording ? theme.accent : 'var(--color-text-muted)' }}>
                  {isRecording ? formatTime(timeLeft) : formatTime(maxTime)}
                </div>
                <div className="record-btn-wrap">
                  {isRecording ? (
                    <button className="record-btn recording" style={{ background: theme.accent }} onClick={() => audioRecorder.stop()}>⏹</button>
                  ) : (
                    <button
                      className="record-btn"
                      style={{ background: theme.accent }}
                      onClick={() => audioRecorder.start(null)}
                      disabled={audioRecorder.state === 'requesting'}
                    >
                      🎙
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  {audioRecorder.state === 'idle' ? 'Tap to record (max 60s)' :
                   audioRecorder.state === 'requesting' ? 'Requesting permission…' :
                   'Recording — tap to stop'}
                </p>
              </>
            )}

            {hasBlob && (
              <div style={{ marginBottom: 12 }}>
                <audio className="audio-preview" controls src={URL.createObjectURL(audioRecorder.blob)} />
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => audioRecorder.reset()}>
                  Re-record
                </button>
              </div>
            )}
          </div>
        )}

        {saveError && <p className="note-error">{saveError}</p>}

        <div className="qci-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Skip
          </button>
          <button
            className="btn"
            style={{ background: canSave ? theme.accent : 'var(--color-border)', color: canSave ? '#fff' : 'var(--color-text-muted)', flex: 1 }}
            onClick={handleSave}
            disabled={!canSave || saving || !entry?.id}
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
