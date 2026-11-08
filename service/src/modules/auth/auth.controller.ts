import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as authService from './auth.service.js'
import { googleSignInSchema } from './auth.validation.js'
import { clearSessionCookie, readSessionCookie, setSessionCookie } from './session-cookie.js'

// POST /api/v1/auth/google   (public)
// Body: { idToken }  →  sets the session cookie, returns { user: { id, email, name }, expiresAt }
export async function signInWithGoogle(req: Request, res: Response): Promise<void> {
  const { idToken } = googleSignInSchema.parse(req.body)
  const { user, session } = await authService.signInWithGoogle(idToken)

  setSessionCookie(res, session.token, session.expiresAt)
  res.json({ user, expiresAt: session.expiresAt })
}

// POST /api/v1/auth/logout   (public, so it also works when the session has already expired)
// Ends the session on the server (on every device) and deletes the cookie from this browser.
export async function signOut(req: Request, res: Response): Promise<void> {
  await authService.signOut(readSessionCookie(req))
  clearSessionCookie(res)
  res.status(204).end()
}

// GET /api/v1/me
// Tells the caller who they are, e.g. to show "Signed in as …".
export function getMe(req: Request, res: Response): void {
  res.json(getCurrentUser(req))
}
