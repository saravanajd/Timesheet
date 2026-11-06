import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, firebaseConfigError } from '../lib/firebase'
import { normalizeTasks } from '../lib/dayData'
import { getSnapshotSaveStatus } from '../lib/saveStatus'
import { useDebouncedSave } from './useDebouncedSave'
import { useOnlineStatus } from './useOnlineStatus'
import { useToast } from './useToast'

export type DaySaveStatus = 'loading' | 'saving' | 'saved' | 'offline' | 'error'

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected timesheet save error occurred.'
}

export function useDay(uid: string, key: string) {
  const isOnline = useOnlineStatus()
  const { showError } = useToast()
  const [tasks, setTasks] = useState<string[]>([''])
  const [hoursOverride, setHoursOverride] = useState<number | null>(null)
  const [status, setStatus] = useState<DaySaveStatus>(
    db ? 'loading' : 'error',
  )
  const [error, setError] = useState<string | null>(
    db ? null : firebaseConfigError ?? 'Firestore is unavailable.',
  )
  const tasksRef = useRef(tasks)
  const hoursOverrideRef = useRef(hoursOverride)
  const dirtyRef = useRef(false)
  const latestPayloadRef = useRef<{
    tasks: string[]
    hoursOverride: number | null
  } | null>(null)
  const { saveDayDebounced, flushDay } = useDebouncedSave(uid, {
    onSaved: (savedKey, data) => {
      if (
        savedKey === key &&
        latestPayloadRef.current?.tasks === data.tasks &&
        latestPayloadRef.current.hoursOverride === data.hoursOverride
      ) {
        dirtyRef.current = false
        setError(null)
      }
    },
    onError: (failedKey, saveError) => {
      if (failedKey !== key) return
      const message = getErrorMessage(saveError)
      setError(message)
      setStatus('error')
      showError(`Could not save this day: ${message}`)
    },
  })

  useEffect(() => {
    if (isOnline && dirtyRef.current) void flushDay(key)
  }, [flushDay, isOnline, key])

  useEffect(() => {
    if (!db) return

    let active = true
    const dayRef = doc(db, 'users', uid, 'days', key)
    const unsubscribe = onSnapshot(
      dayRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return

        setStatus(getSnapshotSaveStatus(snapshot.metadata, isOnline))
        if (dirtyRef.current) return

        if (snapshot.exists()) {
          const data = snapshot.data()
          const savedTasks = Array.isArray(data.tasks)
            ? normalizeTasks(
                data.tasks.filter(
                  (task): task is string => typeof task === 'string',
                ),
              )
            : []
          const savedOverride =
            typeof data.hoursOverride === 'number' &&
            Number.isFinite(data.hoursOverride)
              ? data.hoursOverride
              : null
          const visibleTasks = [...savedTasks, '']

          tasksRef.current = visibleTasks
          hoursOverrideRef.current = savedOverride
          setTasks(visibleTasks)
          setHoursOverride(savedOverride)
        } else {
          tasksRef.current = ['']
          hoursOverrideRef.current = null
          setTasks([''])
          setHoursOverride(null)
        }

        setError(null)
      },
      (listenerError) => {
        if (!active) return
        const message = getErrorMessage(listenerError)
        setError(message)
        setStatus('error')
        showError(`Could not load this day: ${message}`)
      },
    )

    return () => {
      active = false
      unsubscribe()
      if (dirtyRef.current) {
        void flushDay(key).catch((saveError: unknown) => {
          console.error(`Failed to flush timesheet day ${key}.`, saveError)
        })
      }
    }
  }, [flushDay, isOnline, key, showError, uid])

  const queueSave = useCallback(
    (nextTasks: string[], nextHoursOverride: number | null) => {
      const payload = {
        tasks: nextTasks,
        hoursOverride: nextHoursOverride,
      }
      latestPayloadRef.current = payload
      dirtyRef.current = true
      setError(null)
      setStatus(isOnline ? 'saving' : 'offline')
      saveDayDebounced(key, payload)
    },
    [isOnline, key, saveDayDebounced],
  )

  const updateTasks = useCallback(
    (nextTasks: string[]) => {
      tasksRef.current = nextTasks
      setTasks(nextTasks)
      queueSave(nextTasks, hoursOverrideRef.current)
    },
    [queueSave],
  )

  const updateHoursOverride = useCallback(
    (nextOverride: number | null) => {
      hoursOverrideRef.current = nextOverride
      setHoursOverride(nextOverride)
      queueSave(tasksRef.current, nextOverride)
    },
    [queueSave],
  )

  const saveNow = useCallback(() => flushDay(key), [flushDay, key])

  return {
    tasks,
    hoursOverride,
    status,
    error,
    updateTasks,
    updateHoursOverride,
    saveNow,
  }
}
