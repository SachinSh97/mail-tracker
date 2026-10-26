import { UnauthorizedError } from '../../shared/http-errors.js'
import * as userRepository from '../users/user.repository.js'
import type { AuthenticatedUser } from './auth.types.js'
import { verifyGoogleIdToken } from './google-id-token.js'
import { createSessionToken, type SessionToken } from './session-token.js'

export interface SignInResult {
  user: AuthenticatedUser
  /** Goes into the session cookie only; never sent in a response body */
  session: SessionToken
}

/**
 * Swaps a Google ID token for our own session token.
 * There's no sign-up step: the first sign-in creates the user, with no data yet.
 */
export async function signInWithGoogle(idToken: string): Promise<SignInResult> {
  const account = await verifyGoogleIdToken(idToken)
  if (!account) throw new UnauthorizedError('Google sign-in failed. Please try again.')

  const user = await userRepository.upsertGoogleUser(account)
  return { user, session: await createSessionToken(user.id) }
}
