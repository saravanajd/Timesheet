import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTodos } from './useTodos'
import type { ToastAction } from '../components/ToastContext'

const firestore = vi.hoisted(() => {
  class MockTimestamp {
    readonly millis: number

    constructor(millis: number) {
      this.millis = millis
    }

    static fromDate(date: Date) {
      return new MockTimestamp(date.getTime())
    }

    static now() {
      return new MockTimestamp(1_800_000_000_000)
    }

    toMillis() {
      return this.millis
    }
  }

  return {
    Timestamp: MockTimestamp,
    addDoc: vi.fn<() => Promise<void>>(),
    collection: vi.fn((...parts: unknown[]) => parts.slice(1).join('/')),
    deleteDoc: vi.fn<() => Promise<void>>(),
    doc: vi.fn((...parts: unknown[]) => parts.slice(1).join('/')),
    onSnapshot: vi.fn(() => vi.fn()),
    query: vi.fn((...parts: unknown[]) => parts),
    serverTimestamp: vi.fn(() => 'server timestamp'),
    updateDoc: vi.fn<() => Promise<void>>(),
    where: vi.fn((...parts: unknown[]) => parts),
  }
})

const toast = vi.hoisted(() => ({
  showError: vi.fn(),
  showNotice: vi.fn<(message: string, action?: ToastAction) => void>(),
}))

vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('./useToast', () => ({ useToast: () => toast }))
vi.mock('firebase/firestore', () => ({
  Timestamp: firestore.Timestamp,
  addDoc: firestore.addDoc,
  collection: firestore.collection,
  deleteDoc: firestore.deleteDoc,
  doc: firestore.doc,
  onSnapshot: firestore.onSnapshot,
  query: firestore.query,
  serverTimestamp: firestore.serverTimestamp,
  updateDoc: firestore.updateDoc,
  where: firestore.where,
}))

function getTodosHook() {
  const result: { current: ReturnType<typeof useTodos> | null } = {
    current: null,
  }
  function Harness() {
    result.current = useTodos('test-user')
    return null
  }
  renderToStaticMarkup(<Harness />)
  if (!result.current) throw new Error('To-do hook did not render.')
  return result.current
}

describe('useTodos', () => {
  beforeEach(() => {
    firestore.addDoc.mockReset().mockResolvedValue()
    firestore.collection.mockClear()
    firestore.deleteDoc.mockReset().mockResolvedValue()
    firestore.doc.mockClear()
    firestore.onSnapshot.mockClear()
    firestore.query.mockClear()
    firestore.serverTimestamp.mockClear()
    firestore.updateDoc.mockReset().mockResolvedValue()
    firestore.where.mockClear()
    toast.showError.mockReset()
    toast.showNotice.mockReset()
  })

  it('adds trimmed non-empty text with the to-do schema', () => {
    getTodosHook().addTodo('  Review the proposal  ')

    expect(firestore.addDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/todos',
      {
        text: 'Review the proposal',
        done: false,
        createdAt: 'server timestamp',
        doneAt: null,
      },
    )
  })

  it('completes an item and offers an undo action to restore it', () => {
    getTodosHook().completeTodo('todo-1')

    expect(firestore.updateDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/todos/todo-1',
      { done: true, doneAt: 'server timestamp' },
    )
    expect(toast.showNotice).toHaveBeenCalledExactlyOnceWith(
      'Moved to Completed',
      expect.objectContaining({ label: 'Undo' }),
    )
    const action = toast.showNotice.mock.calls[0][1] as ToastAction
    action.onAction()
    expect(firestore.updateDoc).toHaveBeenLastCalledWith(
      'users/test-user/todos/todo-1',
      { done: false, doneAt: null },
    )
  })

  it('restores a completed item to the pending state', () => {
    getTodosHook().restoreTodo('todo-2')

    expect(firestore.updateDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/todos/todo-2',
      { done: false, doneAt: null },
    )
  })

  it('deletes an item permanently', () => {
    getTodosHook().deleteTodo('todo-3')
    expect(firestore.deleteDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/todos/todo-3',
    )
  })

  it('rejects blank adds and deletes an item whose edited text is cleared', () => {
    const todos = getTodosHook()
    todos.addTodo('  \n ')
    expect(firestore.addDoc).not.toHaveBeenCalled()

    todos.updateTodoText('todo-4', '  ')
    expect(firestore.deleteDoc).toHaveBeenCalledExactlyOnceWith(
      'users/test-user/todos/todo-4',
    )
    expect(firestore.updateDoc).not.toHaveBeenCalled()
  })
})
