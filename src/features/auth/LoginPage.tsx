interface LoginPageProps {
  configured: boolean
  error: string | null
  onSignIn: () => Promise<void>
}

function LoginPage({ configured, error, onSignIn }: LoginPageProps) {
  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: '24rem' }}>
        <h1 className="h4 mb-3">Timesheet</h1>
        <p className="text-secondary mb-4">Sign in to access your timesheet.</p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <button
          className="btn btn-primary w-100"
          disabled={!configured}
          onClick={onSignIn}
          type="button"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  )
}

export default LoginPage
