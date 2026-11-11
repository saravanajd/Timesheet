import { createContext } from 'react'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface ToastContextValue {
  showError: (message: string) => void
  showNotice: (message: string, action?: ToastAction) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
