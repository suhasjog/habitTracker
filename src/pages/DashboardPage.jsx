import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHabits } from '../hooks/useHabits'
import { useEntries } from '../hooks/useEntries'
import WeeklyView from '../components/dashboard/WeeklyView'
import MonthlyView from '../components/dashboard/MonthlyView'
import YearlyView from '../components/dashboard/YearlyView'
import EmptyState from '../components/ui/EmptyState'
import { localDate } from '../utils/dates'

function getStartDate(tab) {
  const today = new Date()
  const days = tab === 'week' ? 6 : tab === 'month' ? 29 : 364
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('en-CA')
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('week')
  const { habits, isLoading: habitsLoading } = useHabits()
  const habitIds = habits.map(h => h.id)
  const today = localDate()

  const startDate = getStartDate(tab)
  const { entries, isLoading: entriesLoading } = useEntries(habitIds, startDate, today)

  const isLoading = habitsLoading || (habitIds.length > 0 && entriesLoading)

  if (!habitsLoading && habits.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="📊"
          title="No habits yet"
          message="Add habits in Settings to start tracking progress."
          actionLabel="Go to Settings"
          onAction={() => navigate('/settings')}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
      </div>

      <div className="dashboard-tabs">
        {[
          { id: 'week', label: 'Week' },
          { id: 'month', label: 'Month' },
          { id: 'year', label: 'Year' },
        ].map(t => (
          <button
            key={t.id}
            className={`dashboard-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <>
          <div className="skeleton skeleton-card" style={{ height: 120 }} />
          <div className="skeleton skeleton-card" style={{ height: 120 }} />
        </>
      ) : (
        <>
          {tab === 'week' && <WeeklyView habits={habits} entries={entries} />}
          {tab === 'month' && <MonthlyView habits={habits} entries={entries} />}
          {tab === 'year' && <YearlyView habits={habits} entries={entries} />}
        </>
      )}
    </div>
  )
}
