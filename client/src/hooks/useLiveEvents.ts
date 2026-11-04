import { useEffect, useRef, useSyncExternalStore } from 'react'
import { liveEvents, type LiveEvent } from '../services/live-events'
import { unreadCount } from '../services/unread-count'

/**
 * Keeps the live connection open while a user is signed in, and keeps the bell's
 * unread count right. Used once, by RequireAuth.
 */
export function useLiveConnection() {
  useEffect(() => {
    liveEvents.start()
    void unreadCount.refresh()

    const unsubscribe = liveEvents.subscribe((event) => {
      if (event.type === 'tracker-opened') unreadCount.increment()
      else void unreadCount.refresh() // reconnected: we may have missed some
    })

    // Coming back to the tab: catch up, in case the connection was asleep in the background
    const onVisible = () => document.visibilityState === 'visible' && void unreadCount.refresh()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      liveEvents.stop()
    }
  }, [])
}

/** Calls `onEvent` for every live event while the component is on screen. */
export function useLiveEvent(onEvent: (event: LiveEvent) => void) {
  // Always call the latest handler without re-subscribing on every render
  const handlerRef = useRef(onEvent)
  useEffect(() => {
    handlerRef.current = onEvent
  })

  useEffect(() => liveEvents.subscribe((event) => handlerRef.current(event)), [])
}

/** The number on the notifications bell */
export function useUnreadCount(): number {
  return useSyncExternalStore(unreadCount.subscribe, unreadCount.get)
}
