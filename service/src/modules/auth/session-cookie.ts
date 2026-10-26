import type { CookieOptions, Request, Response } from 'express'
import { isProduction } from '../../config/env.js'

// The session token lives in an HttpOnly cookie, never in localStorage:
//   - the browser stores it and sends it with every request to this service automatically
//   - page scripts can't read it, so even a cross-site scripting bug can't steal it
//   - SameSite=Lax: other websites can't make the browser send it with their POST/PATCH/DELETE requests
// In production the "__Host-" prefix makes the browser enforce Secure (HTTPS only), Path=/ and no Domain.
export const SESSION_COOKIE = isProduction ? '__Host-mail_tracker_session' : 'mail_tracker_session'

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // local development runs on plain http://localhost
  sameSite: 'lax',
  path: '/',
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions)
}

/** The session token sent by the browser, or null when there's no cookie. */
export function readSessionCookie(req: Request): string | null {
  const value: unknown = req.cookies?.[SESSION_COOKIE]
  return typeof value === 'string' && value !== '' ? value : null
}
