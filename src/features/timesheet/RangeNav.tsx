import {
  addDaysToKey,
  addMonthsToKey,
  clampRange,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  monthRange,
  weekRange,
  type AllowedWindow,
} from '../../lib/workday'

export type TimesheetViewType = 'day' | 'week' | 'month'

interface RangeNavProps {
  view: TimesheetViewType
  dayKey: string
  todayKey: string
  window: AllowedWindow
  onDateChange: (key: string) => void
}

function rangeFor(view: TimesheetViewType, dayKey: string) {
  if (view === 'day') return { startKey: dayKey, endKey: dayKey }
  if (view === 'week') return weekRange(dayKey)
  return monthRange(dayKey)
}

function RangeNav({
  view,
  dayKey,
  todayKey,
  window,
  onDateChange,
}: RangeNavProps) {
  const currentRange = rangeFor(view, dayKey)
  const previousKey =
    view === 'day'
      ? addDaysToKey(dayKey, -1)
      : view === 'week'
        ? addDaysToKey(dayKey, -7)
        : addMonthsToKey(dayKey, -1)
  const nextKey =
    view === 'day'
      ? addDaysToKey(dayKey, 1)
      : view === 'week'
        ? addDaysToKey(dayKey, 7)
        : addMonthsToKey(dayKey, 1)
  const previousRange = rangeFor(view, previousKey)
  const nextRange = rangeFor(view, nextKey)
  const previousDisabled =
    clampRange(previousRange, window)?.startKey !== previousRange.startKey
  const nextDisabled =
    clampRange(nextRange, window)?.endKey !== nextRange.endKey
  const label =
    view === 'day'
      ? `${formatDayLabel(dayKey)}${dayKey === todayKey ? ' · Today' : ''}`
      : view === 'week'
        ? formatWeekLabel(currentRange)
        : formatMonthLabel(dayKey)

  return (
    <nav className="timesheet-nav" aria-label={`${view} navigation`}>
      <button
        aria-label="Previous"
        disabled={previousDisabled}
        onClick={() => onDateChange(previousKey)}
        type="button"
      >
        ‹
      </button>
      <button
        className="timesheet-date-label"
        onClick={() => onDateChange(todayKey)}
        title="Jump to today"
        type="button"
      >
        {label}
      </button>
      <button
        aria-label="Next"
        disabled={nextDisabled}
        onClick={() => onDateChange(nextKey)}
        type="button"
      >
        ›
      </button>
    </nav>
  )
}

export default RangeNav
