import { useCallback } from 'react'
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDocFromCache,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useToast } from './useToast'
import { db } from '../lib/firebase'
import { formatDayLabel, nextDayKey } from '../lib/workday'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function useContinueTask(
  uid: string,
  dayKey: string,
  destinationTasks?: readonly string[],
) {
  const { showError, showNotice } = useToast()

  return useCallback(
    (task: string) => {
      const text = task.trim()
      if (!text) return

      const destinationKey = nextDayKey(dayKey)
      const destinationLabel = formatDayLabel(destinationKey)
      if (destinationTasks?.some((existingTask) => existingTask === text)) {
        showNotice(`Already on ${destinationLabel}`)
        return
      }

      if (!db) {
        showError('Could not continue the task: Firestore is unavailable.')
        return
      }

      const nextDayRef = doc(db, 'users', uid, 'days', destinationKey)
      void setDoc(
        nextDayRef,
        { tasks: arrayUnion(text), updatedAt: serverTimestamp() },
        { merge: true },
      ).catch((error: unknown) => {
        showError(`Could not continue the task: ${getErrorMessage(error)}`)
      })

      showNotice(`Added to ${destinationLabel}`, {
        label: 'Undo',
        onAction: () => {
          void (async () => {
            try {
              await updateDoc(nextDayRef, {
                tasks: arrayRemove(text),
                updatedAt: serverTimestamp(),
              })
              const cachedDay = await getDocFromCache(nextDayRef)
              if (!cachedDay.exists()) return

              const data = cachedDay.data()
              const tasks = Array.isArray(data.tasks)
                ? data.tasks.filter(
                    (value): value is string =>
                      typeof value === 'string' && value.trim().length > 0,
                  )
                : []
              if (tasks.length === 0 && data.hoursOverride == null) {
                await deleteDoc(nextDayRef)
              }
            } catch (error: unknown) {
              showError(`Could not undo continuing the task: ${getErrorMessage(error)}`)
            }
          })()
        },
      })
    },
    [dayKey, destinationTasks, showError, showNotice, uid],
  )
}
