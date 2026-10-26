import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as authController from './auth.controller.js'

// Public: signing in can't require being signed in.
// Rate-limited, since each attempt makes us verify a token.
export const publicAuthRouter = Router()

publicAuthRouter.post(
  '/auth/google',
  rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
  authController.signInWithGoogle,
)
publicAuthRouter.post('/auth/logout', authController.signOut)

// Needs a signed-in user (mounted after `authenticate`)
export const authRouter = Router()

authRouter.get('/me', authController.getMe)
