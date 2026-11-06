import { useCallback, useState } from 'react'
import type { DaysByKey, TimesheetViewType } from '../../types'
import { allowedWindow, getWorkdayKey, weekRange } from '../../lib/workday'
import { useSettings } from '../../hooks/useSettings'
import DayView from './DayView'
import CopyExportActions from './CopyExportActions'
import MonthView from './MonthView'
import RangeNav from './RangeNav'
import SummaryBar from './SummaryBar'
import WeekView from './WeekView'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

interface TimesheetPageProps {
  uid: string
}

function TimesheetPage({ uid }: TimesheetPageProps) {
  const [dateContext] = useState(() => {
    const now = new Date()
    return {
      todayKey: getWorkdayKey(now),
      window: allowedWindow(now),
    }
  })
  const [dayKey, setDayKey] = useState(dateContext.todayKey)
  const [view, setView] = useState<TimesheetViewType>('day')
  const [days, setDays] = useState<DaysByKey>({})
  const {
    settings,
    status,
    error,
    saveAutoHours,
    saveAiWordingEnabled,
  } = useSettings(uid)
  const isOnline = useOnlineStatus()
  const onDaysChange = useCallback((nextDays: DaysByKey) => {
    setDays(nextDays)
  }, [])
  const changeDate = useCallback((nextDateKey: string) => {
    setDays({})
    setDayKey(nextDateKey)
  }, [])
  const changeView = useCallback((nextView: TimesheetViewType) => {
    setDays({})
    setView(nextView)
  }, [])

  return (
    <section className="timesheet-app">
      <header className="timesheet-top">
        <h1>Timesheet</h1>
        <div className="timesheet-view-switcher" aria-label="Timesheet view">
          {(['day', 'week', 'month'] as const).map((nextView) => (
            <button
              aria-pressed={view === nextView}
              className={view === nextView ? 'is-selected' : ''}
              key={nextView}
              onClick={() => changeView(nextView)}
              type="button"
            >
              {nextView[0].toUpperCase() + nextView.slice(1)}
            </button>
          ))}
        </div>
        <CopyExportActions
          autoHours={settings.autoHours}
          dayKey={dayKey}
          days={days}
          uid={uid}
          view={view}
          window={dateContext.window}
        />
      </header>

      <RangeNav
        dayKey={dayKey}
        onDateChange={changeDate}
        todayKey={dateContext.todayKey}
        view={view}
        window={dateContext.window}
      />

      <SummaryBar
        autoHours={settings.autoHours}
        days={days}
        onAutoHoursChange={saveAutoHours}
        aiWordingEnabled={settings.aiWordingEnabled}
        onAiWordingChange={saveAiWordingEnabled}
        status={status}
      />

      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}

      {view === 'day' ? (
        <DayView
          autoHours={settings.autoHours}
          aiWordingEnabled={settings.aiWordingEnabled}
          dayKey={dayKey}
          isOnline={isOnline}
          onDaysChange={onDaysChange}
          todayKey={dateContext.todayKey}
          uid={uid}
        />
      ) : view === 'week' ? (
        <WeekView
          autoHours={settings.autoHours}
          aiWordingEnabled={settings.aiWordingEnabled}
          dayKey={dayKey}
          isOnline={isOnline}
          key={`week:${weekRange(dayKey).startKey}`}
          onDaysChange={onDaysChange}
          todayKey={dateContext.todayKey}
          uid={uid}
        />
      ) : (
        <MonthView
          autoHours={settings.autoHours}
          aiWordingEnabled={settings.aiWordingEnabled}
          dayKey={dayKey}
          isOnline={isOnline}
          key={`month:${dayKey.slice(0, 7)}`}
          onDaysChange={onDaysChange}
          todayKey={dateContext.todayKey}
          uid={uid}
        />
      )}
    </section>
  )
}

export default TimesheetPage
