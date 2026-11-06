import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="timesheet-error-boundary" role="alert">
          <p>Something went wrong while loading your timesheet.</p>
          <button onClick={() => window.location.reload()} type="button">
            Reload
          </button>
        </section>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
