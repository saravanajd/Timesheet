import { Outlet } from 'react-router-dom'
import type { User } from 'firebase/auth'
import OfflineBadge from '../components/OfflineBadge'

interface AppLayoutProps {
  user: User
  error: string | null
  onSignOut: () => Promise<void>
}

function AppLayout({ user, error, onSignOut }: AppLayoutProps) {
  return (
    <main className="container py-3">
      <header className="app-header d-flex align-items-center gap-3 mb-4">
        <span className="text-secondary me-auto">
          Signed in as {user.displayName || user.email || 'Google user'}
        </span>
        <OfflineBadge />
        <button className="btn btn-outline-secondary btn-sm" onClick={onSignOut}>
          Sign out
        </button>
      </header>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <Outlet />
    </main>
  )
}

export default AppLayout
