import { subDays } from 'date-fns'
import type { Timestamp } from 'firebase/firestore'

export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: Timestamp | null
  doneAt: Timestamp | null
}

export function cleanTodoText(text: string): string {
  return text.trim()
}

export function sortPending(todos: readonly Todo[]): Todo[] {
  return [...todos].sort(
    (first, second) =>
      (first.createdAt?.toMillis() ?? 0) -
        (second.createdAt?.toMillis() ?? 0) ||
      first.id.localeCompare(second.id),
  )
}

export function sortCompleted(todos: readonly Todo[]): Todo[] {
  return [...todos].sort(
    (first, second) =>
      (second.doneAt?.toMillis() ?? 0) -
        (first.doneAt?.toMillis() ?? 0) ||
      first.id.localeCompare(second.id),
  )
}

export function thirtyDaysAgo(now: Date): Date {
  return subDays(now, 30)
}
