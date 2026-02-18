import { useState, useEffect } from 'react'
import { getSignedUrl, deleteNote } from '../../services/notes'

export default function NoteViewer({ note, onDeleted, onClose }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (note?.storage_path) {
      setUrlLoading(true)
      getSignedUrl(note.storage_path)
        .then(url => { setSignedUrl(url); setUrlLoading(false) })
        .catch(err => { setUrlError(err.message); setUrlLoading(false) })
    }
  }, [note?.storage_path])

  async function handleDelete() {
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    try {
      await deleteNote(note.id, note.storage_path)
      onDeleted()
    } catch (err) {
      alert('Failed to delete note: ' + err.message)
      setDeleting(false)
    }
  }

  if (!note) return null

  return (
    <div className="note-viewer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="note-viewer-sheet">
        <div className="note-sheet-title">
          {note.type === 'text' ? '📝' : note.type === 'audio' ? '🎙' : '🎥'} Note
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {note.type === 'text' && (
          <div className="note-viewer-content">{note.content}</div>
        )}

        {(note.type === 'audio' || note.type === 'video') && (
          <>
            {urlLoading && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading…</p>}
            {urlError && <p className="note-error">{urlError}</p>}
            {signedUrl && note.type === 'audio' && (
              <audio className="audio-preview" controls src={signedUrl} />
            )}
            {signedUrl && note.type === 'video' && (
              <video className="video-preview" controls playsInline src={signedUrl} />
            )}
          </>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : '🗑️ Delete Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
