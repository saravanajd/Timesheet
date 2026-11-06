import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  it('shows Google sign-in and Firebase setup errors', () => {
    const markup = renderToStaticMarkup(
      <LoginPage
        configured={false}
        error="Firebase is not configured."
        onSignInWithGoogle={vi.fn()}
        onSignInWithEmail={vi.fn()}
        onCreateAccount={vi.fn()}
      />,
    )

    expect(markup).toContain('Sign in with email')
    expect(markup).toContain('Create new account')
    expect(markup).toContain('Sign in with Google')
    expect(markup).toContain('Firebase is not configured.')
    expect(markup).toContain('disabled=""')
  })
})
