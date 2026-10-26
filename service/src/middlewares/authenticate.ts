import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedUser } from '../modules/auth/auth.types.js'
import { readSessionCookie } from '../modules/auth/session-cookie.js'
import { readSessionToken } from '../modules/auth/session-token.js'
import { findUserById } from '../modules/users/user.repository.js'
import { UnauthorizedError } from '../shared/http-errors.js'

// Protects /api routes. Expects the HttpOnly session cookie that POST /api/v1/auth/google sets
// after "Sign in with Google". The browser sends it automatically.
// On success, `req.user` is set so handlers know whose data to read or write.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readSessionCookie(req)
  if (!token) throw new UnauthorizedError('Please sign in')

  const userId = await readSessionToken(token)
  if (!userId) throw new UnauthorizedError('Your session has expired. Please sign in again.')

  // The token is genuine, but the user may have been deleted since it was issued
  const user = await findUserById(userId)
  if (!user) throw new UnauthorizedError('Your account no longer exists. Please sign in again.')

  req.user = user
  next()
}

/**
 * Use inside handlers behind `authenticate` to get the current user.
 * Throws instead of returning undefined, so handlers never need a null check.
 */
export function getCurrentUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new UnauthorizedError()
  return req.user
}
