import { describe, expect, it } from 'vitest'
import { buildExportRows } from './exportRows'

describe('buildExportRows', () => {
  it('skips days without tasks, uses overrides, sorts rows, and totals hours', () => {
    expect(
      buildExportRows(
        {
          '2026-11-05': {
            tasks: [' Task three ', '  '],
            hoursOverride: 7.5,
          },
          '2026-11-04': { tasks: [' ', '\n'], hoursOverride: 5 },
          '2026-11-03': {
            tasks: ['Task one', ' Task two '],
            hoursOverride: null,
          },
        },
        9,
      ),
    ).toEqual({
      rows: [
        {
          date: '2026-11-03',
          weekday: 'Tue',
          tasks: ['Task one', 'Task two'],
          hours: 9,
        },
        {
          date: '2026-11-05',
          weekday: 'Thu',
          tasks: ['Task three'],
          hours: 7.5,
        },
      ],
      total: 16.5,
    })
  })

  it('returns no rows and a zero total for days with no tasks', () => {
    expect(
      buildExportRows(
        { '2026-11-04': { tasks: [], hoursOverride: 8 } },
        9,
      ),
    ).toEqual({ rows: [], total: 0 })
  })
})
