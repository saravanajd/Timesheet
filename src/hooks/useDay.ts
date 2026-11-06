import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, firebaseConfigError } from '../lib/firebase'
import { normalizeTasks } from '../lib/dayData'

export type DaySaveStatus = 'loading' | 'saving' | 'saved' | 'error'

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected timesheet save error occurred.'
}

export function useDay(uid: string, key: string) {
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
  const flushRef = useRef<() => Promise<void>>(async () => {})
  const scheduleRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!db) return

    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null
    let writing = false
    const dayRef = doc(db, 'users', uid, 'days', key)

    const flush = async () => {
      if (!dirtyRef.current || writing) return
      if (timer) clearTimeout(timer)
      timer = null

      const savedTasks = normalizeTasks(tasksRef.current)
      const savedHoursOverride = hoursOverrideRef.current
      dirtyRef.current = false
      writing = true
      if (active) setStatus('saving')

      try {
        if (savedTasks.length === 0 && savedHoursOverride === null) {
          await deleteDoc(dayRef)
        } else {
          await setDoc(dayRef, {
            tasks: savedTasks,
            hoursOverride: savedHoursOverride,
            updatedAt: serverTimestamp(),
          })
        }

        if (active) {
          setError(null)
          setStatus(dirtyRef.current ? 'saving' : 'saved')
        }
        writing = false
        if (dirtyRef.current) schedule()
      } catch (saveError: unknown) {
        const hasNewerChanges = dirtyRef.current
        dirtyRef.current = true
        if (active) {
          setError(getErrorMessage(saveError))
          setStatus('error')
        }
        writing = false
        if (hasNewerChanges) schedule()
      }
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void flush()
      }, 600)
    }

    flushRef.current = flush
    scheduleRef.current = schedule

    const unsubscribe = onSnapshot(
      dayRef,
      (snapshot) => {
        if (!active || dirtyRef.current || writing) return

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
        setStatus('saved')
      },
      (listenerError) => {
        if (!active) return
        setError(getErrorMessage(listenerError))
        setStatus('error')
      },
    )

    return () => {
      active = false
      unsubscribe()
      if (timer) clearTimeout(timer)
      timer = null
      scheduleRef.current = () => {}
      flushRef.current = async () => {}
      if (dirtyRef.current) void flush()
    }
  }, [uid, key])

  const updateTasks = useCallback((nextTasks: string[]) => {
    tasksRef.current = nextTasks
    setTasks(nextTasks)
    dirtyRef.current = true
    setError(null)
    setStatus('saving')
    scheduleRef.current()
  }, [])

  const updateHoursOverride = useCallback((nextOverride: number | null) => {
    hoursOverrideRef.current = nextOverride
    setHoursOverride(nextOverride)
    dirtyRef.current = true
    setError(null)
    setStatus('saving')
    scheduleRef.current()
  }, [])

  const saveNow = useCallback(() => flushRef.current(), [])

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
