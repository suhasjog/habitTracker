export default function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h2 className="empty-state-title">{title}</h2>}
      {message && <p className="empty-state-message">{message}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
