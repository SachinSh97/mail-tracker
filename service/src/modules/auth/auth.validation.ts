import { z } from 'zod'

// POST /api/v1/auth/google
export const googleSignInSchema = z.strictObject({
  /** The ID token the "Sign in with Google" button gave the web app */
  idToken: z.string().min(1).max(4096),
})
