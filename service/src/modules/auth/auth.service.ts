import { UnauthorizedError } from '../../shared/http-errors.js'
import * as userRepository from '../users/user.repository.js'
import type { AuthenticatedUser } from './auth.types.js'
import { verifyGoogleIdToken } from './google-id-token.js'
import { createSessionToken } from './session-token.js'

export interface SignInResponse {
  sessionToken: string
  expiresAt: Date
  user: AuthenticatedUser
}

/**
 * Swaps a Google ID token for our own session token.
 * There's no sign-up step: the first sign-in creates the user, with no data yet.
 */
export async function signInWithGoogle(idToken: string): Promise<SignInResponse> {
  const account = await verifyGoogleIdToken(idToken)
  if (!account) throw new UnauthorizedError('Google sign-in failed. Please try again.')

  const user = await userRepository.upsertGoogleUser(account)
  const { token, expiresAt } = await createSessionToken(user.id)
  return { sessionToken: token, expiresAt, user }
}
