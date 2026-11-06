import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContext } from './ToastContext'

interface Toast {
  id: number
  message: string
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<Toast | null>(null)
  const nextIdRef = useRef(0)

  const showError = useCallback((message: string) => {
    nextIdRef.current += 1
    setToast({ id: nextIdRef.current, message })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const contextValue = useMemo(() => ({ showError }), [showError])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <div className="timesheet-toast" role="alert">
          {toast.message}
          <button
            aria-label="Dismiss error"
            className="timesheet-toast-dismiss"
            onClick={() => setToast(null)}
            type="button"
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}
