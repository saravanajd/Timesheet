import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db, firebaseConfigError } from '../lib/firebase'
import { clampRange, allowedWindow } from '../lib/workday'
import { getSnapshotSaveStatus } from '../lib/saveStatus'
import { reconcileTaskDraft } from '../lib/dayData'
import { useDaySave } from './useDaySave'
import { useOnlineStatus } from './useOnlineStatus'
import { useToast } from './useToast'
import type { DayEntry, DaysByKey } from '../types'

export type DaysRangeStatus =
  | 'loading'
  | 'editing'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'error'

interface RangeState {
  rangeId: string
  days: DaysByKey
  status: DaysRangeStatus
  error: string | null
}

const EMPTY_DAYS: DaysByKey = {}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected timesheet save error occurred.'
}

export function useDaysRange(uid: string, startKey: string, endKey: string) {
  const isOnline = useOnlineStatus()
  const { showError } = useToast()
  const window = useMemo(() => allowedWindow(new Date()), [])
  const range = useMemo(
    () => clampRange({ startKey, endKey }, window),
    [endKey, startKey, window],
  )
  const rangeId = `${range?.startKey ?? 'empty'}:${range?.endKey ?? 'empty'}`
  const [rangeState, setRangeState] = useState<RangeState | null>(null)
  const dirtyKeysRef = useRef(new Set<string>())
  const latestPayloadRef = useRef(new Map<string, DayEntry>())
  const snapshotStatusRef = useRef<DaysRangeStatus>('loading')

  const { stageDay, flushDay } = useDaySave(uid, {
    onSaved: (key, payload) => {
      if (latestPayloadRef.current.get(key) !== payload) return
      latestPayloadRef.current.delete(key)
      dirtyKeysRef.current.delete(key)
      setRangeState((current) =>
        current?.rangeId === rangeId
          ? {
              ...current,
              status:
                dirtyKeysRef.current.size > 0 ? 'editing' : 'saved',
              error: null,
            }
          : current,
      )
    },
    onError: (key, saveError) => {
      const message = getErrorMessage(saveError)
      setRangeState((current) =>
        current?.rangeId === rangeId
          ? {
              ...current,
              status: 'error',
              error: `Could not save ${key}: ${message}`,
            }
          : current,
      )
      showError(`Could not save ${key}: ${message}`)
    },
  })

  useEffect(() => {
    if (!db || !range) return

    let active = true
    const daysCollection = collection(db, 'users', uid, 'days')
    const daysQuery = query(
      daysCollection,
      where(documentId(), '>=', range.startKey),
      where(documentId(), '<=', range.endKey),
    )

    const unsubscribe = onSnapshot(
      daysQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return
        snapshotStatusRef.current = getSnapshotSaveStatus(
          snapshot.metadata,
          isOnline,
        )
        setRangeState((current) => {
          const nextDays: Record<string, DayEntry> = {}
          for (const dayDocument of snapshot.docs) {
            const data = dayDocument.data()
            nextDays[dayDocument.id] = {
              tasks: Array.isArray(data.tasks)
                ? data.tasks.filter(
                    (task): task is string =>
                      typeof task === 'string' && task.trim().length > 0,
                  )
                : [],
              hoursOverride:
                typeof data.hoursOverride === 'number' &&
                Number.isFinite(data.hoursOverride)
                  ? data.hoursOverride
                  : null,
            }
          }

          if (current?.rangeId === rangeId) {
            for (const [key, localDay] of Object.entries(current.days)) {
              const savedDay = nextDays[key]
              if (savedDay) {
                nextDays[key] = {
                  ...savedDay,
                  tasks: reconcileTaskDraft(savedDay.tasks, localDay.tasks),
                }
              } else if (localDay.tasks.every((task) => !task.trim())) {
                nextDays[key] = { tasks: localDay.tasks, hoursOverride: null }
              }
            }
            for (const key of dirtyKeysRef.current) {
              const localDay = current.days[key]
              if (localDay) nextDays[key] = localDay
            }
          }

          return {
            rangeId,
            days: nextDays,
            status:
              dirtyKeysRef.current.size > 0
                ? current?.status ?? 'editing'
                : snapshotStatusRef.current,
            error: null,
          }
        })
      },
      (listenerError) => {
        if (!active) return
        const message = getErrorMessage(listenerError)
        setRangeState((current) => ({
          rangeId,
          days:
            current?.rangeId === rangeId ? current.days : EMPTY_DAYS,
          status: 'error',
          error: message,
        }))
        showError(`Could not load timesheet days: ${message}`)
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [isOnline, range, rangeId, showError, uid])

  const updateDay = useCallback(
    (key: string, day: DayEntry) => {
      dirtyKeysRef.current.add(key)
      latestPayloadRef.current.set(key, day)
      setRangeState((current) => ({
        rangeId,
        days: {
          ...(current?.rangeId === rangeId ? current.days : {}),
          [key]: day,
        },
        status: 'editing',
        error: null,
      }))
      stageDay(key, day)
    },
    [rangeId, stageDay],
  )

  const saveNow = useCallback(
    (key: string) => {
      if (dirtyKeysRef.current.has(key)) {
        setRangeState((current) =>
          current?.rangeId === rangeId
            ? { ...current, status: isOnline ? 'saving' : 'offline' }
            : current,
        )
      }
      return flushDay(key)
    },
    [flushDay, isOnline, rangeId],
  )

  const currentState =
    rangeState?.rangeId === rangeId
      ? rangeState
      : {
          rangeId,
          days: EMPTY_DAYS,
          status: !db
            ? ('error' as const)
            : range
              ? ('loading' as const)
              : ('saved' as const),
          error: db ? null : firebaseConfigError ?? 'Firestore is unavailable.',
        }

  return {
    range,
    days: currentState.days,
    status: currentState.status,
    error: currentState.error,
    updateDay,
    saveNow,
  }
}
