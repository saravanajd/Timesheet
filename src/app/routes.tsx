import { HashRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import TimesheetPage from '../features/timesheet/TimesheetPage'

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TimesheetPage />} />
          <Route path="*" element={<TimesheetPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default AppRoutes
