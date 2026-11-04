import { BASE_URL } from './http'
import type { TrackerOpenedEvent } from './types'

// One live connection to the service (Server-Sent Events) while the user is signed in.
// The service pushes a message the moment one of their emails is opened; screens subscribe to react.
//
// The browser's EventSource reconnects on its own after a network drop. Events sent while it was
// disconnected are missed, so after a reconnect we send a `reconnected` event and screens reload.
// If the session has ended, the service answers 401 and EventSource gives up (it never retries errors).

export type LiveEvent = TrackerOpenedEvent | { type: 'reconnected' }

const listeners = new Set<(event: LiveEvent) => void>()
let source: EventSource | null = null

function notify(event: LiveEvent) {
  listeners.forEach((listener) => listener(event))
}

export const liveEvents = {
  start() {
    if (source) return
    // withCredentials: send the session cookie even when the API is on another address (VITE_API_URL)
    source = new EventSource(`${BASE_URL}/api/v1/live-events`, { withCredentials: true })

    let connectedBefore = false
    source.addEventListener('open', () => {
      if (connectedBefore) notify({ type: 'reconnected' })
      connectedBefore = true
    })
    source.addEventListener('tracker-opened', (message) => {
      try {
        notify(JSON.parse((message as MessageEvent<string>).data) as TrackerOpenedEvent)
      } catch {
        // A malformed message is skipped; the next one or a reload will catch up
      }
    })
  },

  stop() {
    source?.close()
    source = null
  },

  /** Calls `listener` for every live event. Returns a function that stops listening. */
  subscribe(listener: (event: LiveEvent) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
