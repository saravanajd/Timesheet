import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContext, type ToastAction } from './ToastContext'

interface Toast {
  id: number
  message: string
  action?: ToastAction
  isError: boolean
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<Toast | null>(null)
  const nextIdRef = useRef(0)

  const showError = useCallback((message: string) => {
    nextIdRef.current += 1
    setToast({ id: nextIdRef.current, message, isError: true })
  }, [])

  const showNotice = useCallback((message: string, action?: ToastAction) => {
    nextIdRef.current += 1
    setToast({ id: nextIdRef.current, message, action, isError: false })
  }, [])

  const toastId = toast?.id
  const toastDuration = toast?.action ? 6000 : 5000
  useEffect(() => {
    if (toastId === undefined) return
    const timer = setTimeout(
      () => setToast((current) => (current?.id === toastId ? null : current)),
      toastDuration,
    )
    return () => clearTimeout(timer)
  }, [toastDuration, toastId])

  const contextValue = useMemo(
    () => ({ showError, showNotice }),
    [showError, showNotice],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <div
          className={`timesheet-toast${toast.isError ? '' : ' is-notice'}`}
          role={toast.isError ? 'alert' : 'status'}
        >
          {toast.message}
          {toast.action && (
            <button
              className="timesheet-toast-action"
              onClick={() => {
                setToast(null)
                toast.action?.onAction()
              }}
              type="button"
            >
              {toast.action.label}
            </button>
          )}
          <button
            aria-label="Dismiss notification"
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
