// Who is making the request. Set by the `authenticate` middleware on every protected /api request.
export interface AuthenticatedUser {
  /** Our user ID (users.id). Every collection and tracker is saved under it. */
  id: string
  /** Current Google email, lowercase */
  email: string
  /** Display name from Google, e.g. "Sachin Sharma" */
  name: string | null
}

// Make `req.user` known to TypeScript in every Express handler
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
