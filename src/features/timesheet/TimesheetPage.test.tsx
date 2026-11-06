import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import TimesheetPage from './TimesheetPage'

describe('TimesheetPage', () => {
  it('shows the app title', () => {
    expect(renderToStaticMarkup(<TimesheetPage uid="test-user" />)).toContain(
      'Timesheet',
    )
  })
})
