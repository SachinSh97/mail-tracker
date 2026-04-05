import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedUser } from '../modules/auth/auth.types.js'
import { readSessionToken } from '../modules/auth/session-token.js'
import { findUserById } from '../modules/users/user.repository.js'
import { UnauthorizedError } from '../shared/http-errors.js'

// Protects /api routes. Expects:  Authorization: Bearer <sessionToken>
// The web app gets that token from POST /api/v1/auth/google after "Sign in with Google".
// On success, `req.user` is set so handlers know whose data to read or write.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readBearerToken(req)
  if (!token) throw new UnauthorizedError('Sign in first: add an "Authorization: Bearer <token>" header')

  const userId = await readSessionToken(token)
  if (!userId) throw new UnauthorizedError('Your session has expired. Please sign in again.')

  // The token is genuine, but the user may have been deleted since it was issued
  const user = await findUserById(userId)
  if (!user) throw new UnauthorizedError('Your account no longer exists. Please sign in again.')

  req.user = user
  next()
}

function readBearerToken(req: Request): string | null {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

/**
 * Use inside handlers behind `authenticate` to get the current user.
 * Throws instead of returning undefined, so handlers never need a null check.
 */
export function getCurrentUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new UnauthorizedError()
  return req.user
}
