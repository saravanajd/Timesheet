import { describe, expect, it } from 'vitest'
import type { DayEntry } from '../types'
import { displayHours, rangeTotals } from './hours'

describe('displayHours', () => {
  it('uses a defined override even when the day has no tasks', () => {
    expect(
      displayHours({ tasks: [], hoursOverride: 4.5 }, 9),
    ).toBe(4.5)
    expect(
      displayHours({ tasks: ['Task'], hoursOverride: 0 }, 9),
    ).toBe(0)
  })

  it('uses automatic hours when a day has a non-empty task', () => {
    expect(
      displayHours({ tasks: ['  ', 'Task'], hoursOverride: null }, 9),
    ).toBe(9)
  })

  it('returns zero without tasks or with only blank tasks', () => {
    expect(displayHours({ tasks: [], hoursOverride: null }, 9)).toBe(0)
    expect(
      displayHours({ tasks: [' ', '\n\t'], hoursOverride: null }, 9),
    ).toBe(0)
  })
})

describe('rangeTotals', () => {
  it('totals positive display hours and counts worked days', () => {
    const days: Record<string, DayEntry> = {
      '2026-11-01': { tasks: ['Task'], hoursOverride: null },
      '2026-11-02': { tasks: [], hoursOverride: 2.5 },
      '2026-11-03': { tasks: [], hoursOverride: 0 },
      '2026-11-04': { tasks: ['  '], hoursOverride: null },
    }

    expect(rangeTotals(days, 9)).toEqual({ totalHours: 11.5, daysWorked: 2 })
  })
})
