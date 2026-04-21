import { ROUTES } from '../constants/routes'
import { request } from './http'
import { session } from './session'
import type { SignInResponse } from './types'

// "Sign in with Google" using Google's standard redirect flow (OpenID Connect).
// No Google script is loaded into the page:
//
//   1. startGoogleSignIn()     we send the browser to Google's sign-in page
//   2. Google sends it back to /auth/callback#id_token=…   (an ID token: "this is sachin@gmail.com")
//   3. completeGoogleSignIn()  we give that ID token to our service, which checks it with Google
//                              and returns our OWN session token, valid for weeks
//
// `state` and `nonce` are random values we make up in step 1 and check in step 3. They prove the
// response is for a sign-in this tab started (not a forged link, not a replayed old token).

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const PENDING_KEY = 'mail-tracker:google-sign-in'

/** What we remember between leaving for Google and coming back */
interface PendingSignIn {
  state: string
  nonce: string
  returnTo: string
}

function randomString(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Only allow paths inside this app, so a crafted link can't send users to another site */
function safeReturnPath(path: string | undefined): string {
  return path?.startsWith('/') && !path.startsWith('//') ? path : ROUTES.home
}

/** Reads a JWT's payload without checking its signature. Only for the nonce: the service verifies the rest. */
function readTokenPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return {}
  }
}

/** Reads and forgets the pending sign-in, so each one can be completed only once */
function takePendingSignIn(): PendingSignIn | null {
  const raw = sessionStorage.getItem(PENDING_KEY)
  sessionStorage.removeItem(PENDING_KEY)
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// React runs effects twice in development; this makes sure the callback is processed only once
let completing: Promise<string> | null = null

export const authService = {
  isConfigured: GOOGLE_CLIENT_ID !== '',

  /** Step 1: leaves the app for Google's sign-in page. `returnTo` is where to land afterwards. */
  startGoogleSignIn(returnTo: string): void {
    const pending: PendingSignIn = {
      state: randomString(),
      nonce: randomString(),
      returnTo: safeReturnPath(returnTo),
    }
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}${ROUTES.authCallback}`,
      response_type: 'id_token',
      scope: 'openid email profile',
      state: pending.state,
      nonce: pending.nonce,
      prompt: 'select_account',
    })
    window.location.assign(`${GOOGLE_AUTH_URL}?${params}`)
  },

  /**
   * Step 3: called on /auth/callback with the URL fragment Google sent back.
   * Saves the session and returns the path to go to. Throws a readable error if anything is off.
   */
  completeGoogleSignIn(urlFragment: string): Promise<string> {
    completing ??= finishSignIn(urlFragment)
    return completing
  },

  signOut(): void {
    session.clear()
  },
}

async function finishSignIn(urlFragment: string): Promise<string> {
  const response = new URLSearchParams(urlFragment.replace(/^#/, ''))
  const pending = takePendingSignIn()

  if (response.get('error') === 'access_denied') throw new Error('Sign-in was cancelled.')
  if (response.get('error')) throw new Error(`Google sign-in failed (${response.get('error')}).`)
  if (!pending || response.get('state') !== pending.state) {
    throw new Error('This sign-in link is not valid any more. Please sign in again.')
  }

  const idToken = response.get('id_token')
  if (!idToken || readTokenPayload(idToken).nonce !== pending.nonce) {
    throw new Error('Google sign-in could not be verified. Please try again.')
  }

  const result = await request<SignInResponse>('/auth/google', { method: 'POST', body: { idToken } })
  session.save({
    token: result.sessionToken,
    expiresAt: result.expiresAt,
    email: result.user.email,
    name: result.user.name,
  })
  return pending.returnTo
}
