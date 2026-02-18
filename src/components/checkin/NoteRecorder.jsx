import { useState, useRef } from 'react'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'
import { createTextNote, createMediaNote } from '../../services/notes'

export default function NoteRecorder({ entryId, userId, onSaved, onClose }) {
  const [noteType, setNoteType] = useState('text')
  const [textContent, setTextContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const audioRecorder = useMediaRecorder('audio')
  const videoRecorder = useMediaRecorder('video')
  const activeRecorder = noteType === 'audio' ? audioRecorder : videoRecorder

  const videoPreviewRef = useRef(null)

  const maxTime = noteType === 'audio' ? 60 : 30
  const timeLeft = maxTime - activeRecorder.elapsed
  const isRecording = activeRecorder.state === 'recording'
  const hasBlobReady = activeRecorder.state === 'stopped' && activeRecorder.blob

  function formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleTypeChange(type) {
    audioRecorder.reset()
    videoRecorder.reset()
    setNoteType(type)
    setSaveError('')
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      if (noteType === 'text') {
        if (!textContent.trim()) return
        await createTextNote(entryId, userId, textContent.trim())
      } else {
        const recorder = noteType === 'audio' ? audioRecorder : videoRecorder
        await createMediaNote(entryId, userId, noteType, recorder.blob, recorder.elapsed)
      }
      onSaved()
    } catch (err) {
      setSaveError(err.message || 'Failed to save note.')
      setSaving(false)
    }
  }

  function renderTextMode() {
    return (
      <>
        <div className="form-group">
          <textarea
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder="How did it go?"
            rows={5}
            autoFocus
          />
        </div>
        {saveError && <p className="note-error">{saveError}</p>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!textContent.trim() || saving}>
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </>
    )
  }

  function renderMediaMode() {
    const recorder = noteType === 'audio' ? audioRecorder : videoRecorder
    const { state, elapsed, blob, errorMsg } = recorder

    return (
      <>
        {state === 'error' && (
          <div className="note-error">{errorMsg}</div>
        )}

        {noteType === 'video' && (state === 'requesting' || state === 'recording') && (
          <video ref={videoPreviewRef} className="camera-preview" muted playsInline />
        )}

        {(state === 'idle' || state === 'requesting' || state === 'recording') && state !== 'error' && (
          <div className="recording-area">
            <div className="recording-timer">
              {state === 'recording' ? formatTime(timeLeft) : formatTime(maxTime)}
            </div>
            <div className="record-btn-wrap">
              {state === 'recording' ? (
                <button className="record-btn recording" onClick={() => recorder.stop()}>⏹</button>
              ) : (
                <button
                  className="record-btn"
                  onClick={() => recorder.start(noteType === 'video' ? videoPreviewRef : null)}
                  disabled={state === 'requesting'}
                >
                  {noteType === 'audio' ? '🎙' : '🎥'}
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {state === 'idle' ? `Tap to record (max ${maxTime}s)` :
               state === 'requesting' ? 'Requesting permission…' :
               'Recording — tap to stop'}
            </p>
          </div>
        )}

        {hasBlobReady && (
          <div style={{ marginBottom: 12 }}>
            {noteType === 'audio' ? (
              <audio className="audio-preview" controls src={URL.createObjectURL(blob)} />
            ) : (
              <video className="video-preview" controls playsInline src={URL.createObjectURL(blob)} />
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => recorder.reset()}>
              Re-record
            </button>
          </div>
        )}

        {saveError && <p className="note-error">{saveError}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasBlobReady || saving}
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="note-recorder-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="note-recorder-sheet">
        <div className="note-sheet-title">
          Add Note
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="note-type-buttons">
          {['text', 'audio', 'video'].map(t => (
            <button
              key={t}
              className={`note-type-btn${noteType === t ? ' active' : ''}`}
              onClick={() => handleTypeChange(t)}
            >
              {t === 'text' ? '📝 Text' : t === 'audio' ? '🎙 Audio' : '🎥 Video'}
            </button>
          ))}
        </div>

        {noteType === 'text' ? renderTextMode() : renderMediaMode()}
      </div>
    </div>
  )
}
