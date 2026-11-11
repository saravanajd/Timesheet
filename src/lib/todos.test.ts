import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
  cleanTodoText,
  sortCompleted,
  sortPending,
  thirtyDaysAgo,
  type Todo,
} from './todos'

function todo(
  id: string,
  createdAt: number,
  doneAt: number | null = null,
): Todo {
  return {
    id,
    text: id,
    done: doneAt !== null,
    createdAt: Timestamp.fromMillis(createdAt),
    doneAt: doneAt === null ? null : Timestamp.fromMillis(doneAt),
  }
}

describe('to-do helpers', () => {
  it('trims text and sorts pending oldest first', () => {
    expect(cleanTodoText('  Follow up   ')).toBe('Follow up')
    expect(sortPending([todo('later', 20), todo('earlier', 10)]).map((item) => item.id))
      .toEqual(['earlier', 'later'])
  })

  it('sorts completed newest first', () => {
    expect(
      sortCompleted([
        todo('earlier', 10, 100),
        todo('later', 20, 200),
      ]).map((item) => item.id),
    ).toEqual(['later', 'earlier'])
  })

  it('calculates the completed-list cutoff thirty calendar days ago', () => {
    expect(thirtyDaysAgo(new Date('2026-11-11T12:00:00Z')).toISOString()).toBe(
      '2026-10-12T12:00:00.000Z',
    )
  })
})
