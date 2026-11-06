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

export function useDaySave(uid: string, handlers: SaveHandlers = {}) {
  const handlersRef = useRef(handlers)
  const mountedRef = useRef(false)
  const draftsRef = useRef(new Map<string, DaySaveData>())

  useEffect(() => {
    mountedRef.current = true
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const stageDay = useCallback((key: string, day: DaySaveData) => {
    draftsRef.current.set(key, day)
  }, [])

  const flushDay = useCallback(
    (key: string) => {
      const day = draftsRef.current.get(key)
      if (day) {
        draftsRef.current.delete(key)
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
      }
      return flushDaySave(uid, key).catch(() => {})
    },
    [uid],
  )

  return { stageDay, flushDay }
}
