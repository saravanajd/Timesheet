import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import type { DayEntry } from '../types'
import { db } from './firebase'
import { normalizeTasks } from './dayData'

export type DaySaveData = Pick<DayEntry, 'tasks' | 'hoursOverride'>

interface SaveCallbacks {
  onSaved?: (key: string, data: DaySaveData) => void
  onError?: (key: string, error: unknown) => void
}

interface PendingSave {
  data: DaySaveData
  callbacks: SaveCallbacks
}

interface SaveQueue {
  timer: ReturnType<typeof setTimeout> | null
  pending: PendingSave | null
  inFlight: Promise<void> | null
}

const queues = new Map<string, SaveQueue>()

function getQueue(uid: string, key: string): SaveQueue {
  const queueKey = `${uid}/${key}`
  let queue = queues.get(queueKey)
  if (!queue) {
    queue = { timer: null, pending: null, inFlight: null }
    queues.set(queueKey, queue)
  }
  return queue
}

export async function saveDay(
  uid: string,
  key: string,
  day: DaySaveData,
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.')

  const tasks = normalizeTasks(day.tasks)
  const dayRef = doc(db, 'users', uid, 'days', key)

  if (tasks.length === 0 && day.hoursOverride === null) {
    await deleteDoc(dayRef)
    return
  }

  await setDoc(dayRef, {
    tasks,
    hoursOverride: day.hoursOverride,
    updatedAt: serverTimestamp(),
  })
}

export function scheduleDaySave(
  uid: string,
  key: string,
  data: DaySaveData,
  callbacks: SaveCallbacks = {},
): void {
  const queue = getQueue(uid, key)
  queue.pending = { data, callbacks }
  if (queue.timer) clearTimeout(queue.timer)
  queue.timer = setTimeout(() => {
    queue.timer = null
    void flushDaySave(uid, key).catch(() => {})
  }, 600)
}

export async function flushDaySave(uid: string, key: string): Promise<void> {
  const queue = getQueue(uid, key)
  if (queue.timer) clearTimeout(queue.timer)
  queue.timer = null

  if (queue.inFlight) {
    await queue.inFlight
    if (queue.pending) await flushDaySave(uid, key)
    return
  }

  const pending = queue.pending
  if (!pending) return
  queue.pending = null

  queue.inFlight = saveDay(uid, key, pending.data)
    .then(() => pending.callbacks.onSaved?.(key, pending.data))
    .catch((error: unknown) => {
      const hasNewerPending = queue.pending !== null
      if (!hasNewerPending) queue.pending = pending
      pending.callbacks.onError?.(key, error)
      if (hasNewerPending) {
        if (queue.timer) clearTimeout(queue.timer)
        queue.timer = setTimeout(() => {
          queue.timer = null
          void flushDaySave(uid, key).catch(() => {})
        }, 600)
      }
      throw error
    })
    .finally(() => {
      queue.inFlight = null
    })

  await queue.inFlight
  if (queue.pending) await flushDaySave(uid, key)
}
