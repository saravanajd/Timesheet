export interface DayEntry {
  tasks: string[]
  hoursOverride: number | null
}

export type DaysByKey = Readonly<Record<string, DayEntry>>

export interface UserSettings {
  autoHours: number
  timeZone: string
}
