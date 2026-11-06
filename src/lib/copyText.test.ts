import { describe, expect, it } from 'vitest'
import { buildCopyText } from './copyText'

describe('buildCopyText', () => {
  it('formats task days, skips empty days, and totals the displayed hours', () => {
    const text = buildCopyText(
      'November 2026',
      {
        '2026-11-03': {
          tasks: ['Task one', '  ', 'Task two '],
          hoursOverride: null,
        },
        '2026-11-04': { tasks: [], hoursOverride: 8 },
        '2026-11-05': {
          tasks: ['Task three'],
          hoursOverride: 7.5,
        },
      },
      9,
    )

    expect(text).toBe(
      [
        'November 2026',
        '',
        'Nov 3 (Tue) - 9 h',
        '- Task one',
        '- Task two',
        '',
        'Nov 5 (Thu) - 7.5 h',
        '- Task three',
        '',
        'Total: 16.5 h',
      ].join('\n'),
    )
  })

  it('shows a zero total when there are no task days', () => {
    expect(buildCopyText('November 2026', {}, 9)).toBe(
      'November 2026\n\nTotal: 0 h',
    )
  })
})
