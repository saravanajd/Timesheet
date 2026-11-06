import { displayHours } from '../../lib/hours'
import { formatDayLabel } from '../../lib/workday'
import { parseAutoHoursInput } from '../../lib/dayData'
import { useDay } from '../../hooks/useDay'
import HoursInput from './HoursInput'
import TaskList from './TaskList'
import type { SettingsStatus } from '../../hooks/useSettings'

interface DayContentProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  settingsStatus: SettingsStatus
  settingsError: string | null
  onSaveAutoHours: (autoHours: number) => void
}

function formatHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

function DayContent({
  uid,
  dayKey,
  todayKey,
  autoHours,
  settingsStatus,
  settingsError,
  onSaveAutoHours,
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
  const hours = displayHours(day, autoHours)
  const [weekday, monthAndDate] = formatDayLabel(dayKey).split(', ')
  const dayNumber = Number(dayKey.slice(-2))

  return (
    <>
      <div className="timesheet-summary">
        <span>
          Total <strong>{formatHours(hours)}</strong> h
        </span>
        <label>
          Auto hours per day
          <input
            aria-label="Auto hours per day"
            defaultValue={autoHours}
            inputMode="decimal"
            key={autoHours}
            onBlur={(event) => {
              const nextHours = parseAutoHoursInput(event.currentTarget.value)
              if (nextHours !== null) onSaveAutoHours(nextHours)
              else event.currentTarget.value = String(autoHours)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            type="text"
          />
          {settingsStatus === 'saving' && <small>Saving…</small>}
        </label>
      </div>

      {settingsError && (
        <div className="timesheet-error" role="alert">
          {settingsError}
        </div>
      )}
      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}

      <div className="timesheet-card">
        <div
          className={`timesheet-day${dayKey === todayKey ? ' is-today' : ''}`}
        >
          <div className="timesheet-day-date">
            {dayNumber}
            <small>
              {weekday} · {monthAndDate?.split(' ')[0]}
            </small>
          </div>
          <TaskList
            autoFocusLastLine={status !== 'loading'}
            onBlur={() => {
              void saveNow()
            }}
            onTasksChange={updateTasks}
            tasks={tasks}
          />
          <HoursInput
            displayHours={hours}
            hoursOverride={hoursOverride}
            onBlur={() => {
              void saveNow()
            }}
            onChange={updateHoursOverride}
          />
        </div>
      </div>
      <div className="timesheet-save-status" aria-live="polite">
        {status === 'loading' ? 'Loading…' : status === 'saving' ? 'Saving…' : ''}
        {status === 'saved' ? 'Saved' : ''}
        {status === 'error' ? 'Save failed' : ''}
      </div>
    </>
  )
}

export default DayContent
