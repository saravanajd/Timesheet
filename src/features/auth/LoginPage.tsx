import { useState, type FormEvent } from 'react'

interface LoginPageProps {
  configured: boolean
  error: string | null
  onSignInWithGoogle: () => Promise<void>
  onSignInWithEmail: (email: string, password: string) => Promise<void>
  onCreateAccount: (email: string, password: string) => Promise<void>
}

type AuthMode = 'signIn' | 'createAccount'

function LoginPage({
  configured,
  error,
  onSignInWithGoogle,
  onSignInWithEmail,
  onCreateAccount,
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signIn') {
        await onSignInWithEmail(email, password)
      } else {
        await onCreateAccount(email, password)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true)
    try {
      await onSignInWithGoogle()
    } finally {
      setSubmitting(false)
    }
  }

  const creatingAccount = mode === 'createAccount'

  return (
    <main className="container py-5">
      <section className="login-card mx-auto" aria-labelledby="login-title">
        <h1 className="h4 mb-2" id="login-title">Timesheet</h1>
        <p className="login-description">
          {creatingAccount
            ? 'Create an account to start tracking your time.'
            : 'Sign in to access your timesheet.'}
        </p>
        {error && (
          <div className="alert app-alert" role="alert">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="login-email">Email</label>
          <input
            autoComplete="email"
            disabled={!configured || submitting}
            id="login-email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            type="email"
            value={email}
          />
          <label htmlFor="login-password">Password</label>
          <input
            autoComplete={creatingAccount ? 'new-password' : 'current-password'}
            disabled={!configured || submitting}
            id="login-password"
            minLength={6}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            type="password"
            value={password}
          />
          <button
            className="login-primary"
            disabled={!configured || submitting}
            type="submit"
          >
            {submitting
              ? 'Please wait…'
              : creatingAccount
                ? 'Create account'
                : 'Sign in with email'}
          </button>
        </form>

        <p className="login-toggle">
          {creatingAccount ? 'Already have an account?' : 'New to Timesheet?'}{' '}
          <button
            disabled={submitting}
            onClick={() => setMode(creatingAccount ? 'signIn' : 'createAccount')}
            type="button"
          >
            {creatingAccount ? 'Sign in' : 'Create new account'}
          </button>
        </p>

        <div className="login-divider"><span>or</span></div>
        <button
          className="login-google"
          disabled={!configured || submitting}
          onClick={() => void handleGoogleSignIn()}
          type="button"
        >
          Sign in with Google
        </button>
      </section>
    </main>
  )
}

export default LoginPage
