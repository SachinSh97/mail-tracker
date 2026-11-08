import { jwtVerify, SignJWT } from 'jose'
import { env } from '../../config/env.js'

// After a Google sign-in we hand out our OWN token, so the user stays signed in for weeks
// (Google's token only lasts an hour). It's a JWT signed with SESSION_SECRET:
// nobody can create or change one without the secret.
//
// It carries the user's ID and their session version (`ver`). Signing out adds 1 to the version
// stored on the user, so every token issued before that stops working at once, even copies.
// Changing SESSION_SECRET signs everyone out.
const secret = new TextEncoder().encode(env.SESSION_SECRET)
const ISSUER = 'mail-tracker'
const ALGORITHM = 'HS256'

export interface SessionToken {
  token: string
  expiresAt: Date
}

export interface SessionClaims {
  userId: string
  sessionVersion: number
}

export async function createSessionToken(user: {
  id: string
  sessionVersion: number
}): Promise<SessionToken> {
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  const token = await new SignJWT({ ver: user.sessionVersion })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(ISSUER)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  return { token, expiresAt }
}

/** What's inside a valid session token, or null if it's fake, changed or expired. */
export async function readSessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: [ALGORITHM] })
    if (!payload.sub || typeof payload.ver !== 'number') return null
    return { userId: payload.sub, sessionVersion: payload.ver }
  } catch {
    return null
  }
}
