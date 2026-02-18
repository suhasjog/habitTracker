import { useEffect } from 'react'

export default function NudgeToast({ habitName, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="nudge-toast" role="alert">
      <span>Don't give up on <strong>{habitName}</strong>! You've got this 💪</span>
      <button onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  )
}
