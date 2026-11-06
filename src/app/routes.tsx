import { HashRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import LoginPage from '../features/auth/LoginPage'
import TimesheetPage from '../features/timesheet/TimesheetPage'
import { useAuth } from '../hooks/useAuth'
import ErrorBoundary from '../components/ErrorBoundary'

function AppRoutes() {
  const {
    user,
    loading,
    error,
    configured,
    signInWithGoogle,
    signInWithEmail,
    createAccount,
    signOut,
  } = useAuth()

  if (loading) {
    return (
      <main className="container py-3" role="status">
        Checking sign-in…
      </main>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginPage
          configured={configured}
          error={error}
          onSignInWithGoogle={signInWithGoogle}
          onSignInWithEmail={signInWithEmail}
          onCreateAccount={createAccount}
        />
      </ErrorBoundary>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          element={
            <AppLayout user={user} error={error} onSignOut={signOut} />
          }
        >
          <Route
            path="/"
            element={<TimesheetPage key={user.uid} uid={user.uid} />}
          />
          <Route
            path="*"
            element={<TimesheetPage key={user.uid} uid={user.uid} />}
          />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes
