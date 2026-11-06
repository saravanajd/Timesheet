import { useState } from 'react'
import DayContent from './DayContent'
import {
  allowedWindow,
  formatDayLabel,
  getWorkdayKey,
  listRangeKeys,
} from '../../lib/workday'
import { useSettings } from '../../hooks/useSettings'

interface DayViewProps {
  uid: string
}

function DayView({ uid }: DayViewProps) {
  const [dateContext] = useState(() => {
    const now = new Date()
    return {
      todayKey: getWorkdayKey(now),
      window: allowedWindow(now),
    }
  })
  const [dayKey, setDayKey] = useState(dateContext.todayKey)
  const { settings, status, error, saveAutoHours } = useSettings(uid)
  const allowedKeys = listRangeKeys({
    startKey: dateContext.window.minKey,
    endKey: dateContext.window.maxKey,
  })
  const currentIndex = allowedKeys.indexOf(dayKey)

  return (
    <section className="timesheet-app" aria-label="Timesheet day view">
      <header className="timesheet-top">
        <h1>Timesheet</h1>
      </header>

      <nav className="timesheet-nav" aria-label="Day navigation">
        <button
          aria-label="Previous day"
          disabled={currentIndex <= 0}
          onClick={() => setDayKey(allowedKeys[currentIndex - 1])}
          type="button"
        >
          ‹
        </button>
        <button
          className="timesheet-date-label"
          onClick={() => setDayKey(dateContext.todayKey)}
          title="Jump to today"
          type="button"
        >
          {dayKey === dateContext.todayKey
            ? `${formatDayLabel(dayKey)} · Today`
            : formatDayLabel(dayKey)}
        </button>
        <button
          aria-label="Next day"
          disabled={currentIndex < 0 || currentIndex >= allowedKeys.length - 1}
          onClick={() => setDayKey(allowedKeys[currentIndex + 1])}
          type="button"
        >
          ›
        </button>
      </nav>

      <DayContent
        autoHours={settings.autoHours}
        dayKey={dayKey}
        key={dayKey}
        onSaveAutoHours={saveAutoHours}
        settingsError={error}
        settingsStatus={status}
        todayKey={dateContext.todayKey}
        uid={uid}
      />
      <p className="timesheet-tip">
        Type a task, press <kbd>Enter</kbd> for the next one, <kbd>Backspace</kbd>{' '}
        on an empty line removes it, <kbd>Ctrl</kbd>+<kbd>Delete</kbd> deletes
        any task (or click the ✕ on its right). Hours fill in automatically
        once the day has tasks; click the number only to change it (clear it to
        go back to auto).
      </p>
    </section>
  )
}

export default DayView
