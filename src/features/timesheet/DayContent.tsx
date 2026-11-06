import { useEffect } from 'react'
import { useDay } from '../../hooks/useDay'
import DayRow from './DayRow'
import type { DaysByKey } from '../../types'

interface DayContentProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  aiWordingEnabled: boolean
  isOnline: boolean
  onDaysChange: (days: DaysByKey) => void
}

function DayContent({
  uid,
  dayKey,
  todayKey,
  autoHours,
  aiWordingEnabled,
  isOnline,
  onDaysChange,
}: DayContentProps) {
  const {
    tasks,
    hoursOverride,
    status,
    error,
    updateTasks,
    updateHoursOverride,
    saveNow,
  } = useDay(uid, dayKey)
  const day = { tasks, hoursOverride }
  useEffect(() => {
    onDaysChange({ [dayKey]: { tasks, hoursOverride } })
  }, [dayKey, tasks, hoursOverride, onDaysChange])

  return (
    <>
      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}
      <div className="timesheet-card">
        <DayRow
          autoFocusLastLine={status !== 'loading'}
          autoHours={autoHours}
          aiWordingEnabled={aiWordingEnabled}
          day={day}
          dayKey={dayKey}
          isOnline={isOnline}
          isToday={dayKey === todayKey}
          showMonth
          onBlur={() => {
            void saveNow()
          }}
          onDayChange={(nextDay) => {
            if (nextDay.tasks !== tasks) updateTasks(nextDay.tasks)
            if (nextDay.hoursOverride !== hoursOverride) {
              updateHoursOverride(nextDay.hoursOverride)
            }
          }}
          keepTrailingEmpty
        />
      </div>
      <div className="timesheet-save-status" aria-live="polite">
        {status === 'loading' ? 'Loading…' : status === 'saving' ? 'Saving…' : ''}
        {status === 'saved' ? 'Saved' : ''}
        {status === 'offline' ? 'Saved offline · will sync' : ''}
        {status === 'error' ? 'Save failed' : ''}
      </div>
    </>
  )
}

export default DayContent
