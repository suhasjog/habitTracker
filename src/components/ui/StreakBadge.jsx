export default function StreakBadge({ streak, isReward }) {
  if (!streak || streak < 1) return null
  return (
    <span className={`streak-badge${isReward ? ' reward' : ''}`}>
      🔥 {streak}
    </span>
  )
}
