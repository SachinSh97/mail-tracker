import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as authService from './auth.service.js'
import { googleSignInSchema } from './auth.validation.js'

// POST /api/v1/auth/google   (public)
// Body: { idToken }  →  { sessionToken, expiresAt, user: { email, name } }
export async function signInWithGoogle(req: Request, res: Response): Promise<void> {
  const { idToken } = googleSignInSchema.parse(req.body)
  res.json(await authService.signInWithGoogle(idToken))
}

// GET /api/v1/me
// Tells the caller who they are, e.g. to show "Signed in as …".
export function getMe(req: Request, res: Response): void {
  res.json(getCurrentUser(req))
}
