import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export interface DateRange {
  startKey: string
  endKey: string
}

export interface AllowedWindow {
  maxKey: string
}

const WORKDAY_TIME_ZONE = 'America/Chicago'
const DATE_KEY_FORMAT = 'yyyy-MM-dd'

function parseDateKey(key: string): Date {
  return parseISO(key)
}

function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

export function getWorkdayKey(now: Date): string {
  return formatInTimeZone(now, WORKDAY_TIME_ZONE, DATE_KEY_FORMAT)
}

export function weekRange(key: string): DateRange {
  const date = parseDateKey(key)
  return {
    startKey: toDateKey(startOfWeek(date, { weekStartsOn: 1 })),
    endKey: toDateKey(endOfWeek(date, { weekStartsOn: 1 })),
  }
}

export function monthRange(key: string): DateRange {
  const date = parseDateKey(key)
  return {
    startKey: toDateKey(startOfMonth(date)),
    endKey: toDateKey(endOfMonth(date)),
  }
}

export function isWeekend(key: string): boolean {
  const day = getDay(parseDateKey(key))
  return day === 0 || day === 6
}

export function allowedWindow(now: Date): AllowedWindow {
  const currentDate = parseDateKey(getWorkdayKey(now))
  return {
    maxKey: toDateKey(endOfMonth(currentDate)),
  }
}

export function clampRange(
  range: DateRange,
  window: AllowedWindow,
): DateRange | null {
  const start = parseDateKey(range.startKey)
  const end = parseDateKey(range.endKey)
  const maximum = parseDateKey(window.maxKey)

  if (isAfter(start, end)) return null

  const clampedEnd = isAfter(end, maximum) ? maximum : end

  if (isAfter(start, clampedEnd)) return null

  return {
    startKey: toDateKey(start),
    endKey: toDateKey(clampedEnd),
  }
}

export function listRangeKeys(range: DateRange): string[] {
  const start = parseDateKey(range.startKey)
  const end = parseDateKey(range.endKey)
  if (isAfter(start, end)) return []

  const keys: string[] = []
  for (let date = start; !isAfter(date, end); date = addDays(date, 1)) {
    keys.push(toDateKey(date))
  }
  return keys
}

export function addDaysToKey(key: string, amount: number): string {
  return toDateKey(addDays(parseDateKey(key), amount))
}

export function addMonthsToKey(key: string, amount: number): string {
  return toDateKey(startOfMonth(addMonths(parseDateKey(key), amount)))
}

export function formatDayLabel(key: string): string {
  return format(parseDateKey(key), 'EEE, MMM d')
}

export function formatWeekLabel(range: DateRange): string {
  const start = parseDateKey(range.startKey)
  const end = parseDateKey(range.endKey)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}

export function formatMonthLabel(key: string): string {
  return format(parseDateKey(key), 'MMMM yyyy')
}
