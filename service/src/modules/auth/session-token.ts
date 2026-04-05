import { jwtVerify, SignJWT } from 'jose'
import { env } from '../../config/env.js'

// After a Google sign-in we hand out our OWN token, so the user stays signed in for weeks
// (Google's token only lasts an hour). It's a JWT signed with SESSION_SECRET:
// nobody can create or change one without the secret. It only carries the user's ID;
// `authenticate` loads the rest from the users table. Changing SESSION_SECRET signs everyone out.
const secret = new TextEncoder().encode(env.SESSION_SECRET)
const ISSUER = 'mail-tracker'
const ALGORITHM = 'HS256'

export interface SessionToken {
  token: string
  expiresAt: Date
}

export async function createSessionToken(userId: string): Promise<SessionToken> {
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  const token = await new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(ISSUER)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  return { token, expiresAt }
}

/** Returns the user ID inside a valid session token, or null if it's fake, changed or expired. */
export async function readSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: [ALGORITHM] })
    return payload.sub ?? null
  } catch {
    return null
  }
}
