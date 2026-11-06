import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <main className="container py-3">
      <Outlet />
    </main>
  )
}

export default AppLayout
