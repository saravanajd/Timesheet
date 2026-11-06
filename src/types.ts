export interface DayEntry {
  tasks: string[]
  hoursOverride: number | null
}

export interface UserSettings {
  autoHours: number
  timeZone: string
}
