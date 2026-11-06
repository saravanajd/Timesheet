import AppRoutes from './app/routes'
import { ToastProvider } from './components/ToastProvider'

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}

export default App
