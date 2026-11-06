import { HashRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import LoginPage from '../features/auth/LoginPage'
import TimesheetPage from '../features/timesheet/TimesheetPage'
import { useAuth } from '../hooks/useAuth'

function AppRoutes() {
  const {
    user,
    loading,
    error,
    configured,
    signInWithGoogle,
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
      <LoginPage
        configured={configured}
        error={error}
        onSignIn={signInWithGoogle}
      />
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
