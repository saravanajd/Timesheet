import type { MutableRefObject, Ref } from 'react'
import { displayHours } from '../../lib/hours'
import { formatDayLabel, isWeekend } from '../../lib/workday'
import type { DayEntry } from '../../types'
import HoursInput from './HoursInput'
import TaskList from './TaskList'

interface DayRowProps {
  dayKey: string
  day: DayEntry
  autoHours: number
  isToday: boolean
  keepTrailingEmpty?: boolean
  autoFocusLastLine?: boolean
  showMonth?: boolean
  navigationRefs?: MutableRefObject<Array<HTMLTextAreaElement | null>>
  navigationOffset?: number
  rowRef?: Ref<HTMLDivElement>
  onDayChange: (day: DayEntry) => void
  onBlur: () => void
}

function DayRow({
  dayKey,
  day,
  autoHours,
  isToday,
  keepTrailingEmpty = false,
  autoFocusLastLine = false,
  showMonth = false,
  navigationRefs,
  navigationOffset,
  rowRef,
  onDayChange,
  onBlur,
}: DayRowProps) {
  const weekend = isWeekend(dayKey)
  const [weekday, monthAndDate] = formatDayLabel(dayKey).split(', ')
  const taskLines = day.tasks.length > 0 ? day.tasks : ['']

  return (
    <div
      className={`timesheet-day${isToday ? ' is-today' : ''}${weekend ? ' is-weekend' : ''}`}
      ref={rowRef}
    >
      <div className="timesheet-day-date">
        {Number(dayKey.slice(-2))}
        <small>
          {weekday}
          {showMonth && monthAndDate ? ` · ${monthAndDate.split(' ')[0]}` : ''}
        </small>
      </div>
      <TaskList
        autoFocusLastLine={autoFocusLastLine}
        keepTrailingEmpty={keepTrailingEmpty}
        navigationOffset={navigationOffset}
        navigationRefs={navigationRefs}
        onBlur={onBlur}
        onTasksChange={(tasks) => onDayChange({ ...day, tasks })}
        placeholder={weekend ? 'Weekend · day off' : 'Add task…'}
        tasks={taskLines}
      />
      <HoursInput
        displayHours={displayHours(day, autoHours)}
        hoursOverride={day.hoursOverride}
        onBlur={onBlur}
        onChange={(hoursOverride) => onDayChange({ ...day, hoursOverride })}
      />
    </div>
  )
}

export default DayRow
