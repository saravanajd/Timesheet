import type { DayEntry, DaysByKey } from '../types'

export function displayHours(day: DayEntry, autoHours: number): number {
  const hasTasks = day.tasks.some((task) => task.trim().length > 0)
  return day.hoursOverride ?? (hasTasks ? autoHours : 0)
}

export function rangeTotals(
  days: DaysByKey,
  autoHours: number,
): { totalHours: number; daysWorked: number } {
  return Object.values(days).reduce(
    (totals, day) => {
      const hours = displayHours(day, autoHours)
      if (hours > 0) {
        totals.totalHours += hours
        totals.daysWorked += 1
      }
      return totals
    },
    { totalHours: 0, daysWorked: 0 },
  )
}
