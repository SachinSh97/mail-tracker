import { vi } from 'vitest'

// Real Google ID tokens can't be created in tests. Instead, pretend Google accepts exactly two tokens:
// one for the existing owner, one for a brand-new user. Every other token is rejected, like a fake one.
vi.mock('../../src/modules/auth/google-id-token.js', async () => {
  const { NEW_USER, NEW_USER_GOOGLE_TOKEN, OWNER, OWNER_GOOGLE_TOKEN } = await import('./test-users.js')
  const accounts: Record<string, { googleId: string; email: string; name: string }> = {
    [OWNER_GOOGLE_TOKEN]: { googleId: OWNER.googleId, email: OWNER.email, name: OWNER.name },
    [NEW_USER_GOOGLE_TOKEN]: NEW_USER,
  }
  return { verifyGoogleIdToken: async (token: string) => accounts[token] ?? null }
})
