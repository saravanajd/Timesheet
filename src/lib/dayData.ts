export function normalizeTasks(tasks: readonly string[]): string[] {
  return tasks.map((task) => task.trim()).filter((task) => task.length > 0)
}

export function ensureTrailingEmptyTask(tasks: readonly string[]): string[] {
  const lines = [...tasks]

  while (
    lines.length > 1 &&
    !lines[lines.length - 1].trim() &&
    !lines[lines.length - 2].trim()
  ) {
    lines.pop()
  }

  if (lines.length === 0) return ['']
  if (lines[lines.length - 1].trim()) lines.push('')
  else lines[lines.length - 1] = ''
  return lines
}

export function parseHoursInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null

  const hours = Number(normalized)
  return Number.isFinite(hours) ? hours : null
}

export function parseAutoHoursInput(value: string): number | null {
  const hours = parseHoursInput(value)
  return hours !== null && hours > 0 ? hours : null
}
