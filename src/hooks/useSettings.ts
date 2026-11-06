import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, firebaseConfigError } from '../lib/firebase'
import { useToast } from './useToast'
import type { UserSettings } from '../types'

export type SettingsStatus = 'loading' | 'saving' | 'saved' | 'error'

const DEFAULT_SETTINGS: UserSettings = {
  autoHours: 9,
  timeZone: 'America/Chicago',
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected settings error occurred.'
}

export function useSettings(uid: string) {
  const { showError } = useToast()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [status, setStatus] = useState<SettingsStatus>(
    db ? 'loading' : 'error',
  )
  const [error, setError] = useState<string | null>(
    db ? null : firebaseConfigError ?? 'Firestore is unavailable.',
  )
  const timeZoneRef = useRef(DEFAULT_SETTINGS.timeZone)
  const pendingAutoHoursRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    if (!db) return

    let active = true
    let writing = false
    const settingsRef = doc(db, 'users', uid, 'settings', 'main')

    const flush = async () => {
      const autoHours = pendingAutoHoursRef.current
      if (autoHours === null || writing) return

      pendingAutoHoursRef.current = null
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      writing = true
      if (active) setStatus('saving')

      try {
        await setDoc(
          settingsRef,
          { autoHours, timeZone: timeZoneRef.current },
          { merge: true },
        )
        if (active) {
          setError(null)
          setStatus(
            pendingAutoHoursRef.current === null ? 'saved' : 'saving',
          )
        }
        writing = false
        if (pendingAutoHoursRef.current !== null) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            void flush()
          }, 600)
        }
      } catch (saveError: unknown) {
        if (active) {
          const message = getErrorMessage(saveError)
          setError(message)
          setStatus('error')
          showError(`Could not save settings: ${message}`)
        }
        writing = false
        if (pendingAutoHoursRef.current !== null) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            void flush()
          }, 600)
        }
      }
    }

    flushRef.current = flush
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!active) return

        if (snapshot.exists()) {
          const data = snapshot.data()
          const autoHours =
            typeof data.autoHours === 'number' && Number.isFinite(data.autoHours)
              ? data.autoHours
              : DEFAULT_SETTINGS.autoHours
          const timeZone =
            typeof data.timeZone === 'string'
              ? data.timeZone
              : DEFAULT_SETTINGS.timeZone

          timeZoneRef.current = timeZone
          if (pendingAutoHoursRef.current === null && !writing) {
            setSettings({ autoHours, timeZone })
          }
        } else if (pendingAutoHoursRef.current === null && !writing) {
          timeZoneRef.current = DEFAULT_SETTINGS.timeZone
          setSettings(DEFAULT_SETTINGS)
        }

        setError(null)
        if (pendingAutoHoursRef.current === null && !writing) {
          setStatus('saved')
        }
      },
      (listenerError) => {
        if (!active) return
        const message = getErrorMessage(listenerError)
        setError(message)
        setStatus('error')
        showError(`Could not load settings: ${message}`)
      },
    )

    return () => {
      active = false
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      if (pendingAutoHoursRef.current !== null) void flush()
      flushRef.current = async () => {}
    }
  }, [showError, uid])

  const saveAutoHours = useCallback((autoHours: number) => {
    if (!Number.isFinite(autoHours) || autoHours <= 0) {
      setError('Auto hours must be a positive number.')
      setStatus('error')
      return
    }

    pendingAutoHoursRef.current = autoHours
    setSettings((current) => ({ ...current, autoHours }))
    setError(null)
    setStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void flushRef.current()
    }, 600)
  }, [])

  return { settings, status, error, saveAutoHours }
}
