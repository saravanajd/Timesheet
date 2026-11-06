import { describe, expect, it } from 'vitest'
import {
  ensureTrailingEmptyTask,
  normalizeTasks,
  parseAutoHoursInput,
  parseHoursInput,
} from './dayData'

describe('ensureTrailingEmptyTask', () => {
  it('keeps one trailing empty line and at least one line', () => {
    expect(ensureTrailingEmptyTask([])).toEqual([''])
    expect(ensureTrailingEmptyTask(['Task'])).toEqual(['Task', ''])
    expect(ensureTrailingEmptyTask(['Task', '', ''])).toEqual(['Task', ''])
    expect(ensureTrailingEmptyTask(['', 'Task', ''])).toEqual(['', 'Task', ''])
    expect(ensureTrailingEmptyTask(['  '])).toEqual([''])
  })
})

describe('normalizeTasks', () => {
  it('trims tasks and removes empty lines before saving', () => {
    expect(normalizeTasks([' First task ', '', '  ', 'Second task\t'])).toEqual([
      'First task',
      'Second task',
    ])
  })
})

describe('parseHoursInput', () => {
  it('accepts dot and comma decimals, including zero', () => {
    expect(parseHoursInput('9.5')).toBe(9.5)
    expect(parseHoursInput('9,5')).toBe(9.5)
    expect(parseHoursInput('0')).toBe(0)
  })

  it('returns null for empty and invalid values', () => {
    expect(parseHoursInput('')).toBeNull()
    expect(parseHoursInput('   ')).toBeNull()
    expect(parseHoursInput('1,2.3')).toBeNull()
    expect(parseHoursInput('-2')).toBeNull()
  })
})

describe('parseAutoHoursInput', () => {
  it('accepts only positive values', () => {
    expect(parseAutoHoursInput('9')).toBe(9)
    expect(parseAutoHoursInput('0')).toBeNull()
    expect(parseAutoHoursInput('invalid')).toBeNull()
  })
})
