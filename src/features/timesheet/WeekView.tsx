import { useEffect, useRef } from 'react'
import type { DaysByKey } from '../../types'
import { listRangeKeys, weekRange } from '../../lib/workday'
import { useDaysRange } from '../../hooks/useDaysRange'
import DayRow from './DayRow'

interface WeekViewProps {
  uid: string
  dayKey: string
  todayKey: string
  autoHours: number
  onDaysChange: (days: DaysByKey) => void
}

function WeekView({
  uid,
  dayKey,
  todayKey,
  autoHours,
  onDaysChange,
}: WeekViewProps) {
  const requestedRange = weekRange(dayKey)
  const { range, days, status, error, updateDay, saveNow } = useDaysRange(
    uid,
    requestedRange.startKey,
    requestedRange.endKey,
  )
  const keys = range ? listRangeKeys(range) : []
  const navigationRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const offsets = new Map<string, number>()
  let offset = 0
  for (const key of keys) {
    offsets.set(key, offset)
    offset += Math.max(days[key]?.tasks.length ?? 0, 1)
  }
  const todayRowRef = useRef<HTMLDivElement>(null)
  const containsToday = keys.includes(todayKey)

  useEffect(() => {
    if (containsToday) {
      todayRowRef.current?.scrollIntoView({ block: 'center' })
    }
  }, [containsToday, range?.startKey, range?.endKey])

  useEffect(() => {
    onDaysChange(days)
  }, [days, onDaysChange])

  return (
    <section className="timesheet-view" aria-label="Week view">
      {error && (
        <div className="timesheet-error" role="alert">
          {error}
        </div>
      )}
      <div className="timesheet-card timesheet-range-card">
        {keys.map((key) => (
          <DayRow
            autoHours={autoHours}
            day={days[key] ?? { tasks: [], hoursOverride: null }}
            dayKey={key}
            isToday={key === todayKey}
            key={key}
            navigationOffset={offsets.get(key)}
            navigationRefs={navigationRefs}
            showMonth
            onBlur={() => {
              void saveNow(key)
            }}
            onDayChange={(day) => updateDay(key, day)}
            rowRef={key === todayKey ? todayRowRef : undefined}
          />
        ))}
      </div>
      <div className="timesheet-save-status" aria-live="polite">
        {status === 'loading' ? 'Loading…' : status === 'saving' ? 'Saving…' : ''}
        {status === 'saved' ? 'Saved' : ''}
        {status === 'error' ? 'Save failed' : ''}
      </div>
    </section>
  )
}

export default WeekView
