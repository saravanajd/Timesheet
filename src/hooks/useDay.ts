import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, firebaseConfigError } from '../lib/firebase'
import { normalizeTasks, reconcileTaskDraft } from '../lib/dayData'
import { getSnapshotSaveStatus } from '../lib/saveStatus'
import { useDaySave } from './useDaySave'
import { useOnlineStatus } from './useOnlineStatus'
import { useToast } from './useToast'

export type DaySaveStatus =
  | 'loading'
  | 'editing'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'error'

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
  const { stageDay, flushDay } = useDaySave(uid, {
    onSaved: (savedKey, data) => {
      if (
        savedKey === key &&
        latestPayloadRef.current?.tasks === data.tasks &&
        latestPayloadRef.current.hoursOverride === data.hoursOverride
      ) {
        dirtyRef.current = false
        setError(null)
        setStatus(isOnline ? 'saved' : 'offline')
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
    if (!db) return

    let active = true
    const dayRef = doc(db, 'users', uid, 'days', key)
    const unsubscribe = onSnapshot(
      dayRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return

        if (dirtyRef.current) return
        setStatus(getSnapshotSaveStatus(snapshot.metadata, isOnline))

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
          const visibleTasks = reconcileTaskDraft(
            [...savedTasks, ''],
            tasksRef.current,
          )

          tasksRef.current = visibleTasks
          hoursOverrideRef.current = savedOverride
          setTasks(visibleTasks)
          setHoursOverride(savedOverride)
        } else {
          const visibleTasks = reconcileTaskDraft([''], tasksRef.current)
          tasksRef.current = visibleTasks
          hoursOverrideRef.current = null
          setTasks(visibleTasks)
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
    }
  }, [isOnline, key, showError, uid])

  const stageChanges = useCallback(
    (nextTasks: string[], nextHoursOverride: number | null) => {
      const payload = {
        tasks: nextTasks,
        hoursOverride: nextHoursOverride,
      }
      latestPayloadRef.current = payload
      dirtyRef.current = true
      setError(null)
      setStatus('editing')
      stageDay(key, payload)
    },
    [key, stageDay],
  )

  const updateTasks = useCallback(
    (nextTasks: string[]) => {
      tasksRef.current = nextTasks
      setTasks(nextTasks)
      stageChanges(nextTasks, hoursOverrideRef.current)
    },
    [stageChanges],
  )

  const updateHoursOverride = useCallback(
    (nextOverride: number | null) => {
      hoursOverrideRef.current = nextOverride
      setHoursOverride(nextOverride)
      stageChanges(tasksRef.current, nextOverride)
    },
    [stageChanges],
  )

  const saveNow = useCallback(() => {
    if (dirtyRef.current) setStatus(isOnline ? 'saving' : 'offline')
    return flushDay(key)
  }, [flushDay, isOnline, key])

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
