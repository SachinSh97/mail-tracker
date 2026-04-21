import { useSyncExternalStore } from 'react'
import { session, type Session } from '../services/session'

/** The signed-in user, or null. Re-renders when they sign in or out (in any tab). */
export function useSession(): Session | null {
  return useSyncExternalStore(session.subscribe, session.get)
}
