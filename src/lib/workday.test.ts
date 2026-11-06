import { describe, expect, it } from 'vitest'
import {
  allowedWindow,
  addDaysToKey,
  addMonthsToKey,
  clampRange,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getWorkdayKey,
  isWeekend,
  listRangeKeys,
  monthRange,
  weekRange,
} from './workday'

describe('getWorkdayKey', () => {
  it('uses the Chicago calendar date rather than the device date', () => {
    expect(getWorkdayKey(new Date('2026-11-06T11:30:00Z'))).toBe('2026-11-06')
    expect(getWorkdayKey(new Date('2026-11-06T19:30:00Z'))).toBe('2026-11-06')
  })

  it('changes dates at Chicago midnight', () => {
    expect(getWorkdayKey(new Date('2026-11-07T05:59:59Z'))).toBe('2026-11-06')
    expect(getWorkdayKey(new Date('2026-11-07T06:00:00Z'))).toBe('2026-11-07')
  })

  it('handles the daylight saving start transition', () => {
    expect(getWorkdayKey(new Date('2026-03-08T05:59:59Z'))).toBe('2026-03-07')
    expect(getWorkdayKey(new Date('2026-03-08T06:00:00Z'))).toBe('2026-03-08')
  })

  it('handles the daylight saving end transition', () => {
    expect(getWorkdayKey(new Date('2026-11-01T04:59:59Z'))).toBe('2026-10-31')
    expect(getWorkdayKey(new Date('2026-11-01T05:00:00Z'))).toBe('2026-11-01')
  })
})

describe('date ranges and labels', () => {
  it('returns a Monday-to-Sunday week', () => {
    expect(weekRange('2026-11-06')).toEqual({
      startKey: '2026-11-02',
      endKey: '2026-11-08',
    })
  })

  it('handles month boundaries and leap years', () => {
    expect(monthRange('2026-11-06')).toEqual({
      startKey: '2026-11-01',
      endKey: '2026-11-30',
    })
    expect(monthRange('2024-02-15')).toEqual({
      startKey: '2024-02-01',
      endKey: '2024-02-29',
    })
  })

  it('identifies weekends and lists every key in the range', () => {
    expect(isWeekend('2026-11-06')).toBe(false)
    expect(isWeekend('2026-11-07')).toBe(true)
    expect(isWeekend('2026-11-08')).toBe(true)
    expect(
      listRangeKeys({ startKey: '2026-11-06', endKey: '2026-11-08' }),
    ).toEqual(['2026-11-06', '2026-11-07', '2026-11-08'])
    expect(
      listRangeKeys({ startKey: '2026-11-08', endKey: '2026-11-06' }),
    ).toEqual([])
  })

  it('steps across day and month boundaries', () => {
    expect(addDaysToKey('2026-11-01', -1)).toBe('2026-10-31')
    expect(addDaysToKey('2026-11-30', 1)).toBe('2026-12-01')
    expect(addMonthsToKey('2027-01-15', -1)).toBe('2026-12-01')
    expect(addMonthsToKey('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('formats day, week, and month header labels', () => {
    expect(formatDayLabel('2026-11-06')).toBe('Fri, Nov 6')
    expect(
      formatWeekLabel({ startKey: '2026-11-02', endKey: '2026-11-08' }),
    ).toBe('Nov 2 – Nov 8')
    expect(formatMonthLabel('2026-11-06')).toBe('November 2026')
  })

  it('calculates the current and previous month window across year boundaries', () => {
    expect(allowedWindow(new Date('2026-11-06T18:00:00Z'))).toEqual({
      minKey: '2026-10-01',
      maxKey: '2026-11-30',
    })
    expect(allowedWindow(new Date('2027-01-15T18:00:00Z'))).toEqual({
      minKey: '2026-12-01',
      maxKey: '2027-01-31',
    })
  })

  it('clamps overlapping ranges and returns null for disjoint ranges', () => {
    const window = { minKey: '2026-10-01', maxKey: '2026-11-30' }
    expect(
      clampRange(
        { startKey: '2026-09-28', endKey: '2026-10-04' },
        window,
      ),
    ).toEqual({ startKey: '2026-10-01', endKey: '2026-10-04' })
    expect(
      clampRange(
        { startKey: '2026-12-01', endKey: '2026-12-07' },
        window,
      ),
    ).toBeNull()
  })
})
