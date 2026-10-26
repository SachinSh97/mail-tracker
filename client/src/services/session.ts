// Who is signed in, for showing it in the UI. React components read it through the useSession() hook.
//
// The real credential is NOT here: the service keeps the session in an HttpOnly cookie, which page
// scripts can't read and the browser sends by itself. This file only remembers the user's email, name
// and when the session ends, so a reload shows the right screen straight away. If the cookie has
// expired or was removed, the next API call returns 401 and this is cleared (see http.ts).

export interface Session {
  /** ISO date; after this the service no longer accepts the session cookie */
  expiresAt: string
  email: string
  name: string | null
}

const STORAGE_KEY = 'mail-tracker:user'

// Older versions kept the session token itself under this key. Remove it wherever it's still there.
localStorage.removeItem('mail-tracker:session')
const listeners = new Set<() => void>()

// useSyncExternalStore needs the same object back while nothing changed, so we cache the parse
let cachedRaw: string | null = null
let cachedSession: Session | null = null

function parseSession(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    const isValid = typeof value?.email === 'string' && typeof value?.expiresAt === 'string'
    return isValid ? value : null
  } catch {
    return null
  }
}

function isExpired(value: Session): boolean {
  return new Date(value.expiresAt).getTime() <= Date.now()
}

function notify() {
  listeners.forEach((listener) => listener())
}

export const session = {
  /** The current session, or null when signed out or expired */
  get(): Session | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedSession = parseSession(raw)
    }
    return cachedSession && !isExpired(cachedSession) ? cachedSession : null
  },

  /** Calls `listener` whenever the session changes, here or in another tab. Returns an unsubscribe function. */
  subscribe(listener: () => void) {
    listeners.add(listener)
    window.addEventListener('storage', listener)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', listener)
    }
  },

  save(value: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    notify()
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY)
    notify()
  },
}
