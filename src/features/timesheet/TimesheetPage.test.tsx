import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import TimesheetPage from './TimesheetPage'
import { ToastProvider } from '../../components/ToastProvider'

describe('TimesheetPage', () => {
  it('shows the app title', () => {
    expect(
      renderToStaticMarkup(
        <ToastProvider>
          <TimesheetPage uid="test-user" />
        </ToastProvider>,
      ),
    ).toContain('Timesheet')
  })
})
