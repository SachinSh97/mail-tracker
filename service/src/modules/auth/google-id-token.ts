import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../../config/env.js'

// When you click "Sign in with Google", Google gives the web app an "ID token":
// a signed message saying "this is sachin@gmail.com", valid for 1 hour.
//
// Here we check that the token is real: signed by Google (using Google's public keys),
// not expired, issued for OUR app (audience = our Client ID), and that Google verified the email.
// The public keys are downloaded once and cached by jose.
const googlePublicKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export interface GoogleProfile {
  /** Google's permanent account ID ("sub"). Unlike the email, it never changes. */
  googleId: string
  email: string
  name: string | null
}

/** Returns who the token belongs to, or null if it isn't a valid Google ID token for this app. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, googlePublicKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    })
    if (!payload.sub || payload.email_verified !== true || typeof payload.email !== 'string') return null

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: typeof payload.name === 'string' ? payload.name : null,
    }
  } catch {
    return null // bad signature, expired, wrong audience…
  }
}
