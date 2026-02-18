import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { useHabits } from '../hooks/useHabits'
import { useEntries } from '../hooks/useEntries'
import { useStreaks } from '../hooks/useStreaks'
import HabitList from '../components/habits/HabitList'
import NudgeToast from '../components/ui/NudgeToast'
import QuickCheckIn from '../components/checkin/QuickCheckIn'
import { localDate } from '../utils/dates'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { habits, isLoading: habitsLoading, removeHabit } = useHabits()
  const habitIds = habits.map(h => h.id)

  const today = localDate()
  const thirtyDaysAgo = (() => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - 30)
    return d.toLocaleDateString('en-CA')
  })()

  const {
    entries,
    entryByHabitId,
    isLoading: entriesLoading,
    isCompleted,
    toggleCompletion,
    markHabit,
    error: entriesError,
  } = useEntries(habitIds, thirtyDaysAgo, today)

  const streakMap = useStreaks(habits, entries)

  const completedCount = habitIds.filter(id => isCompleted(id)).length
  const totalCount = habits.length
  const allDone = totalCount > 0 && completedCount === totalCount

  const [shownReward, setShownReward] = useState(null)
  const [quickCheckIn, setQuickCheckIn] = useState(null) // { habit, entry }

  const newReward = habits.find(h => {
    const s = streakMap[h.id]
    return s?.isReward && isCompleted(h.id) && shownReward !== h.id
  })

  const nudgeHabit = habits.find(h => {
    const s = streakMap[h.id]
    return s?.isMissing && !isCompleted(h.id)
  })

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const isLoading = habitsLoading || (habitIds.length > 0 && entriesLoading)

  // Handle tap on habit check:
  // - incomplete → mark via API (get real entry), then show QuickCheckIn
  // - completed → unmark via toggle
  async function handleToggle(habitId) {
    if (isCompleted(habitId)) {
      toggleCompletion(habitId)
      return
    }
    // Apply optimistic visual immediately
    toggleCompletion(habitId)
    // Then get real entry for QuickCheckIn note
    try {
      const entry = await markHabit(habitId)
      const habit = habits.find(h => h.id === habitId)
      if (habit && entry?.id) {
        setQuickCheckIn({ habit, entry })
      }
    } catch {
      // markHabit failed — optimistic update already shown, will reconcile on next refetch
    }
  }

  return (
    <div className="page">
      <div className="home-header">
        <div className="home-date">{dateLabel}</div>
        {!isLoading && totalCount > 0 && (
          <div className="home-progress">
            {completedCount}/{totalCount} done {allDone ? '🎉' : ''}
          </div>
        )}
      </div>

      {newReward && (
        <div className="reward-banner" onClick={() => setShownReward(newReward.id)}>
          🔥 {newReward.name}: {streakMap[newReward.id]?.streak}-day streak! Keep it up!
        </div>
      )}

      {isLoading ? (
        <>
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </>
      ) : allDone ? (
        <div className="all-done-banner">
          All habits done for today! 🎉
          <span style={{ fontSize: 16, fontWeight: 500, marginTop: 4, display: 'block' }}>
            Amazing work — see you tomorrow!
          </span>
        </div>
      ) : null}

      {entriesError && (
        <div className="error-banner">
          Failed to load entries.{' '}
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!isLoading && (
        <HabitList
          habits={habits}
          isCompleted={isCompleted}
          onToggle={handleToggle}
          onEdit={null}
          onDelete={removeHabit}
          streakMap={streakMap}
          entryMap={entryByHabitId}
          showEditDelete={false}
          showNoteIcon={true}
          emptyIcon="🌱"
          emptyTitle="No habits yet"
          emptyMessage="Head to Settings to add your first daily habit."
          emptyActionLabel="Go to Settings"
          onEmptyAction={() => navigate('/settings')}
        />
      )}

      {nudgeHabit && (
        <NudgeToast habitName={nudgeHabit.name} onDismiss={() => {}} />
      )}

      {quickCheckIn && (
        <QuickCheckIn
          habit={quickCheckIn.habit}
          entry={quickCheckIn.entry}
          userId={user?.id}
          onClose={() => setQuickCheckIn(null)}
        />
      )}
    </div>
  )
}
