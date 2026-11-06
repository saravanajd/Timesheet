import { useCallback, useEffect, useRef } from 'react'
import {
  flushDaySave,
  scheduleDaySave,
  type DaySaveData,
} from '../lib/dayStore'

interface SaveHandlers {
  onSaved?: (key: string, day: DaySaveData) => void
  onError?: (key: string, error: unknown) => void
}

export function useDebouncedSave(uid: string, handlers: SaveHandlers = {}) {
  const handlersRef = useRef(handlers)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const saveDayDebounced = useCallback(
    (key: string, day: DaySaveData) => {
      scheduleDaySave(uid, key, day, {
        onSaved: (savedKey, data) => {
          if (mountedRef.current) handlersRef.current.onSaved?.(savedKey, data)
        },
        onError: (failedKey, error) => {
          if (mountedRef.current) {
            handlersRef.current.onError?.(failedKey, error)
          } else {
            console.error(`Failed to save timesheet day ${failedKey}.`, error)
          }
        },
      })
    },
    [uid],
  )

  const flushDay = useCallback(
    (key: string) => flushDaySave(uid, key).catch(() => {}),
    [uid],
  )

  return { saveDayDebounced, flushDay }
}
