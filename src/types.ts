export interface DayEntry {
  tasks: string[]
  hoursOverride: number | null
}

export type DaysByKey = Readonly<Record<string, DayEntry>>
export type TimesheetViewType = 'day' | 'week' | 'month'

export interface UserSettings {
  autoHours: number
  timeZone: string
  aiWordingEnabled: boolean
}
