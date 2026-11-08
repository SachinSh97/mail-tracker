import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { ForbiddenError } from '../shared/http-errors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Blocks requests that change data (POST, PATCH, DELETE) when they come from another website.
 * The SameSite=Strict cookie and CORS already stop this; this is a second, independent check,
 * which also covers sibling subdomains that browsers treat as the "same site".
 *
 * Browsers always send an Origin header with these requests. It must be either:
 *   - this service's own address (e.g. the web app calling through Vite's proxy in development), or
 *   - one of CORS_ORIGINS (the web app's address in production)
 * Requests without an Origin don't come from a web page (curl, tests) and can't ride a user's cookie.
 */
export function rejectCrossSiteWrites(req: Request, _res: Response, next: NextFunction): void {
  const origin = req.get('origin')
  if (SAFE_METHODS.has(req.method) || !origin) return next()

  const ownOrigin = `${req.protocol}://${req.get('host')}`
  if (origin === ownOrigin || env.CORS_ORIGINS.includes(origin)) return next()

  throw new ForbiddenError('Requests from other websites are not allowed')
}
