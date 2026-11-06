import { rangeTotals } from '../../lib/hours'
import { parseAutoHoursInput } from '../../lib/dayData'
import type { DaysByKey } from '../../types'
import type { SettingsStatus } from '../../hooks/useSettings'

interface SummaryBarProps {
  days: DaysByKey
  autoHours: number
  status: SettingsStatus
  onAutoHoursChange: (autoHours: number) => void
}

function formatHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

function SummaryBar({
  days,
  autoHours,
  status,
  onAutoHoursChange,
}: SummaryBarProps) {
  const { totalHours, daysWorked } = rangeTotals(days, autoHours)

  return (
    <div className="timesheet-summary">
      <span>
        Total <strong>{formatHours(totalHours)}</strong> h
      </span>
      <span>
        Days worked <strong>{daysWorked}</strong>
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
            if (nextHours !== null) onAutoHoursChange(nextHours)
            else event.currentTarget.value = String(autoHours)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          type="text"
        />
        {status === 'saving' && <small>Saving…</small>}
      </label>
    </div>
  )
}

export default SummaryBar
