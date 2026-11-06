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

  it('keeps AI wording disabled by default', () => {
    const markup = renderToStaticMarkup(
      <ToastProvider>
        <TimesheetPage uid="test-user" />
      </ToastProvider>,
    )

    expect(markup).toContain('Enable AI wording')
    expect(markup).not.toContain('checked=""')
    expect(markup).not.toContain('Improve wording for task')
  })
})
