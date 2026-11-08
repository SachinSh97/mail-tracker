import { UnauthorizedError } from '../../shared/http-errors.js'
import * as userRepository from '../users/user.repository.js'
import type { AuthenticatedUser } from './auth.types.js'
import { verifyGoogleIdToken } from './google-id-token.js'
import { createSessionToken, readSessionToken, type SessionToken } from './session-token.js'

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

  const { sessionVersion, ...user } = await userRepository.upsertGoogleUser(account)
  return { user, session: await createSessionToken({ id: user.id, sessionVersion }) }
}

/**
 * Ends the user's sessions on the server, so a copied cookie can't be used afterwards.
 * Every device is signed out, since sessions are only told apart by the version they carry.
 * Does nothing for a missing, expired or forged token.
 */
export async function signOut(sessionToken: string | null): Promise<void> {
  const claims = sessionToken ? await readSessionToken(sessionToken) : null
  if (claims) await userRepository.endAllSessions(claims.userId)
}
