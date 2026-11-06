import { format, parseISO } from 'date-fns'
import type { DaysByKey } from '../types'
import { displayHours } from './hours'
import {
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  weekRange,
} from './workday'
import type { TimesheetViewType } from '../types'

function formatHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

export function buildCopyText(
  title: string,
  days: DaysByKey,
  autoHours: number,
): string {
  const entries = Object.entries(days)
    .filter(([, day]) => day.tasks.some((task) => task.trim().length > 0))
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))

  const totalHours = entries.reduce(
    (total, [, day]) => total + displayHours(day, autoHours),
    0,
  )
  const sections = entries.map(([key, day]) => {
    const date = parseISO(key)
    const tasks = day.tasks
      .filter((task) => task.trim().length > 0)
      .map((task) => `- ${task.trim()}`)
      .join('\n')

    return `${format(date, 'MMM d (EEE)')} - ${formatHours(displayHours(day, autoHours))} h\n${tasks}`
  })

  return `${title}\n\n${sections.join('\n\n')}${sections.length > 0 ? '\n\n' : ''}Total: ${formatHours(totalHours)} h`
}

export function copyTitleForView(
  view: TimesheetViewType,
  dayKey: string,
): string {
  if (view === 'day') return formatDayLabel(dayKey)
  if (view === 'week') return formatWeekLabel(weekRange(dayKey))
  return formatMonthLabel(dayKey)
}
