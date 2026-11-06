import { format, parseISO } from 'date-fns'
import type { DaysByKey } from '../types'
import { displayHours } from './hours'

export interface ExportRow {
  date: string
  weekday: string
  tasks: string[]
  hours: number
}

export interface ExportRowsResult {
  rows: ExportRow[]
  total: number
}

export function buildExportRows(
  days: DaysByKey,
  autoHours: number,
): ExportRowsResult {
  const rows = Object.entries(days)
    .filter(([, day]) => day.tasks.some((task) => task.trim().length > 0))
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([date, day]) => ({
      date,
      weekday: format(parseISO(date), 'EEE'),
      tasks: day.tasks
        .map((task) => task.trim())
        .filter((task) => task.length > 0),
      hours: displayHours(day, autoHours),
    }))

  return {
    rows,
    total: rows.reduce((total, row) => total + row.hours, 0),
  }
}
