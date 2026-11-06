import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, firebaseConfigError } from '../lib/firebase'

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected authentication error occurred.'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(auth !== null)
  const [error, setError] = useState<string | null>(firebaseConfigError)

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setError(null)
        setLoading(false)
      },
      (authError: Error) => {
        setError(getErrorMessage(authError))
        setLoading(false)
      },
    )
  }, [])

  async function signInWithGoogle() {
    if (!auth) {
      setError(firebaseConfigError)
      return
    }

    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (signInError: unknown) {
      setError(getErrorMessage(signInError))
    }
  }

  async function signOut() {
    if (!auth) {
      setError(firebaseConfigError)
      return
    }

    setError(null)
    try {
      await firebaseSignOut(auth)
    } catch (signOutError: unknown) {
      setError(getErrorMessage(signOutError))
    }
  }

  return {
    user,
    loading,
    error,
    configured: auth !== null,
    signInWithGoogle,
    signOut,
  }
}
