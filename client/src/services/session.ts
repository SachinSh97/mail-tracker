// Who is signed in. Kept in localStorage so a reload doesn't sign you out.
// React components read it through the useSession() hook.
//
// The session token lives in localStorage, which any script on this page can read. That is acceptable
// here because the app loads no third-party scripts and production builds ship a strict CSP
// (see vite.config.ts). Don't add external scripts without revisiting this.

export interface Session {
  /** Our own token from the service (not Google's), sent as "Authorization: Bearer …" */
  token: string
  /** ISO date; after this the service rejects the token */
  expiresAt: string
  email: string
  name: string | null
}

const STORAGE_KEY = 'mail-tracker:session'
const listeners = new Set<() => void>()

// useSyncExternalStore needs the same object back while nothing changed, so we cache the parse
let cachedRaw: string | null = null
let cachedSession: Session | null = null

function parseSession(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    const isValid =
      typeof value?.token === 'string' &&
      typeof value?.email === 'string' &&
      typeof value?.expiresAt === 'string'
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
