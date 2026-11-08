import { rateLimit } from 'express-rate-limit'
import { isTest } from '../config/env.js'
import { TooManyRequestsError } from '../shared/http-errors.js'
import { getCurrentUser } from './authenticate.js'

/** Changes (create, rename, delete…) one signed-in user may make per minute */
export const WRITES_PER_MINUTE = 60

/**
 * Stops one account (or a script using its cookie) from filling the database in a loop.
 * Counts per user, not per IP, and only POST/PATCH/DELETE: reading is never limited.
 * Mounted after `authenticate`. Off in tests, which create many records quickly.
 */
export const limitWrites = rateLimit({
  windowMs: 60_000,
  limit: WRITES_PER_MINUTE,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => isTest || ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  keyGenerator: (req) => getCurrentUser(req).id,
  handler: () => {
    throw new TooManyRequestsError('You’re making changes too quickly. Please wait a minute.')
  },
})
