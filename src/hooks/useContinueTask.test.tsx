import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContinueTask } from './useContinueTask'
import type { ToastAction } from '../components/ToastContext'

const firestore = vi.hoisted(() => ({
  arrayRemove: vi.fn((value: string) => ({ remove: value })),
  arrayUnion: vi.fn((value: string) => ({ union: value })),
  deleteDoc: vi.fn<() => Promise<void>>(),
  doc: vi.fn((...parts: unknown[]) => parts.slice(1).join('/')),
  getDocFromCache: vi.fn<() => Promise<{
    exists: () => boolean
    data: () => { tasks?: string[]; hoursOverride?: number | null }
  }>>(),
  serverTimestamp: vi.fn(() => 'timestamp'),
  setDoc: vi.fn<() => Promise<void>>(),
  updateDoc: vi.fn<() => Promise<void>>(),
}))

const toast = vi.hoisted(() => ({
  showError: vi.fn(),
  showNotice: vi.fn<(message: string, action?: ToastAction) => void>(),
}))

vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('./useToast', () => ({ useToast: () => toast }))
vi.mock('firebase/firestore', () => ({
  arrayRemove: firestore.arrayRemove,
  arrayUnion: firestore.arrayUnion,
  deleteDoc: firestore.deleteDoc,
  doc: firestore.doc,
  getDocFromCache: firestore.getDocFromCache,
  serverTimestamp: firestore.serverTimestamp,
  setDoc: firestore.setDoc,
  updateDoc: firestore.updateDoc,
}))

function renderContinueTask(destinationTasks?: readonly string[]) {
  const result: { current: ((task: string) => void) | null } = {
    current: null,
  }
  function Harness() {
    result.current = useContinueTask(
      'test-user',
      '2026-11-06',
      destinationTasks,
    )
    return null
  }
  renderToStaticMarkup(<Harness />)
  if (!result.current) throw new Error('Continue task hook did not render.')
  return result.current
}

describe('useContinueTask', () => {
  beforeEach(() => {
    firestore.arrayRemove.mockClear()
    firestore.arrayUnion.mockClear()
    firestore.deleteDoc.mockReset().mockResolvedValue()
    firestore.doc.mockClear()
    firestore.getDocFromCache.mockReset().mockResolvedValue({
      exists: () => true,
      data: () => ({ tasks: [], hoursOverride: null }),
    })
    firestore.serverTimestamp.mockClear()
    firestore.setDoc.mockReset().mockResolvedValue()
    firestore.updateDoc.mockReset().mockResolvedValue()
    toast.showError.mockReset()
    toast.showNotice.mockReset()
  })

  it('adds trimmed task text to the next date with a single merge write', () => {
    renderContinueTask()('  Review the release  ')

    expect(firestore.doc).toHaveBeenCalledExactlyOnceWith(
      {},
      'users',
      'test-user',
      'days',
      '2026-11-07',
    )
    expect(firestore.arrayUnion).toHaveBeenCalledExactlyOnceWith(
      'Review the release',
    )
    expect(firestore.setDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/days/2026-11-07',
      { tasks: { union: 'Review the release' }, updatedAt: 'timestamp' },
      { merge: true },
    )
    expect(toast.showNotice).toHaveBeenCalledWith(
      'Added to Sat, Nov 7',
      expect.objectContaining({ label: 'Undo' }),
    )
  })

  it('skips a task already present in the loaded destination day', () => {
    renderContinueTask(['Review the release'])('Review the release')

    expect(firestore.setDoc).not.toHaveBeenCalled()
    expect(toast.showNotice).toHaveBeenCalledExactlyOnceWith(
      'Already on Sat, Nov 7',
    )
  })

  it('undoes with arrayRemove and deletes an empty cached day without an override', async () => {
    renderContinueTask()('Review the release')
    const action = toast.showNotice.mock.calls[0][1] as ToastAction
    action.onAction()
    await vi.waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalledExactlyOnceWith(
        'users/test-user/days/2026-11-07',
      )
    })

    expect(firestore.updateDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/days/2026-11-07',
      { tasks: { remove: 'Review the release' }, updatedAt: 'timestamp' },
    )
    expect(firestore.getDocFromCache).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/days/2026-11-07',
    )
  })

  it('keeps the day document when an hours override remains after undo', async () => {
    firestore.getDocFromCache.mockResolvedValue({
      exists: () => true,
      data: () => ({ tasks: [], hoursOverride: 4 }),
    })
    renderContinueTask()('Review the release')
    const action = toast.showNotice.mock.calls[0][1] as ToastAction
    action.onAction()

    await vi.waitFor(() => {
      expect(firestore.getDocFromCache).toHaveBeenCalled()
    })
    expect(firestore.deleteDoc).not.toHaveBeenCalled()
  })
})
