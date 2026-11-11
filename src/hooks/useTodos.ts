import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useToast } from './useToast'
import { db } from '../lib/firebase'
import {
  cleanTodoText,
  sortCompleted,
  sortPending,
  thirtyDaysAgo,
  type Todo,
} from '../lib/todos'

function readTodo(snapshot: QueryDocumentSnapshot<DocumentData>): Todo {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    text: typeof data.text === 'string' ? data.text : '',
    done: data.done === true,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
    doneAt: data.doneAt instanceof Timestamp ? data.doneAt : null,
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected to-do error occurred.'
}

export function useTodos(uid: string) {
  const { showError, showNotice } = useToast()
  const [pending, setPending] = useState<Todo[]>([])
  const [completed, setCompleted] = useState<Todo[]>([])
  const [loading, setLoading] = useState(Boolean(db))

  useEffect(() => {
    if (!db) return

    const todosCollection = collection(db, 'users', uid, 'todos')
    const pendingQuery = query(todosCollection, where('done', '==', false))
    const completedQuery = query(
      todosCollection,
      where('doneAt', '>=', Timestamp.fromDate(thirtyDaysAgo(new Date()))),
    )
    let pendingLoaded = false
    let completedLoaded = false
    const setLoaded = () => {
      if (pendingLoaded && completedLoaded) setLoading(false)
    }

    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        pendingLoaded = true
        setPending(sortPending(snapshot.docs.map(readTodo)))
        setLoaded()
      },
      (error: unknown) => {
        pendingLoaded = true
        setLoaded()
        showError(`Could not load to-dos: ${getErrorMessage(error)}`)
      },
    )
    const unsubscribeCompleted = onSnapshot(
      completedQuery,
      (snapshot) => {
        completedLoaded = true
        setCompleted(sortCompleted(snapshot.docs.map(readTodo)))
        setLoaded()
      },
      (error: unknown) => {
        completedLoaded = true
        setLoaded()
        showError(`Could not load completed to-dos: ${getErrorMessage(error)}`)
      },
    )

    return () => {
      unsubscribePending()
      unsubscribeCompleted()
    }
  }, [showError, uid])

  const deleteTodo = useCallback(
    (id: string) => {
      if (!db) {
        showError('Could not delete to-do: Firestore is unavailable.')
        return
      }
      setPending((current) => current.filter((item) => item.id !== id))
      setCompleted((current) => current.filter((item) => item.id !== id))
      void deleteDoc(doc(db, 'users', uid, 'todos', id)).catch((error: unknown) => {
        showError(`Could not delete to-do: ${getErrorMessage(error)}`)
      })
    },
    [showError, uid],
  )

  const addTodo = useCallback(
    (text: string) => {
      const cleanText = cleanTodoText(text)
      if (!cleanText) return
      if (!db) {
        showError('Could not add to-do: Firestore is unavailable.')
        return
      }

      const todosCollection = collection(db, 'users', uid, 'todos')
      void addDoc(todosCollection, {
        text: cleanText,
        done: false,
        createdAt: serverTimestamp(),
        doneAt: null,
      }).catch((error: unknown) => {
        showError(`Could not add to-do: ${getErrorMessage(error)}`)
      })
    },
    [showError, uid],
  )

  const updateTodoText = useCallback(
    (id: string, text: string) => {
      const cleanText = cleanTodoText(text)
      if (!cleanText) {
        void deleteTodo(id)
        return
      }
      if (!db) {
        showError('Could not update to-do: Firestore is unavailable.')
        return
      }
      void updateDoc(doc(db, 'users', uid, 'todos', id), {
        text: cleanText,
      }).catch((error: unknown) => {
        showError(`Could not update to-do: ${getErrorMessage(error)}`)
      })
    },
    [deleteTodo, showError, uid],
  )

  const restoreTodo = useCallback(
    (id: string) => {
      if (!db) {
        showError('Could not restore to-do: Firestore is unavailable.')
        return
      }
      const todo = completed.find((item) => item.id === id)
      if (todo) {
        setCompleted((current) => current.filter((item) => item.id !== id))
        setPending((current) =>
          sortPending([...current, { ...todo, done: false, doneAt: null }]),
        )
      }
      void updateDoc(doc(db, 'users', uid, 'todos', id), {
        done: false,
        doneAt: null,
      }).catch((error: unknown) => {
        showError(`Could not restore to-do: ${getErrorMessage(error)}`)
      })
    },
    [completed, showError, uid],
  )

  const completeTodo = useCallback(
    (id: string) => {
      const firestore = db
      if (!firestore) {
        showError('Could not complete to-do: Firestore is unavailable.')
        return
      }
      const todo = pending.find((item) => item.id === id)
      setPending((current) => current.filter((item) => item.id !== id))
      if (todo) {
        const completedTodo: Todo = {
          ...todo,
          done: true,
          doneAt: Timestamp.now(),
        }
        setCompleted((current) => sortCompleted([...current, completedTodo]))
      }
      void updateDoc(doc(firestore, 'users', uid, 'todos', id), {
        done: true,
        doneAt: serverTimestamp(),
      }).catch((error: unknown) => {
        showError(`Could not complete to-do: ${getErrorMessage(error)}`)
      })
      showNotice('Moved to Completed', {
        label: 'Undo',
        onAction: () => {
          if (todo) {
            setCompleted((current) => current.filter((item) => item.id !== id))
            setPending((current) =>
              sortPending([...current, { ...todo, done: false, doneAt: null }]),
            )
          }
          void updateDoc(doc(firestore, 'users', uid, 'todos', id), {
            done: false,
            doneAt: null,
          }).catch((error: unknown) => {
            showError(`Could not restore to-do: ${getErrorMessage(error)}`)
          })
        },
      })
    },
    [pending, showError, showNotice, uid],
  )

  return {
    pending,
    completed,
    loading,
    addTodo,
    updateTodoText,
    completeTodo,
    restoreTodo,
    deleteTodo,
  }
}
