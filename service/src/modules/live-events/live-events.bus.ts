import { EventEmitter } from 'node:events'

// Passes "something happened" messages from the code that notices it (e.g. a pixel load)
// to the users' open live-event streams (GET /api/v1/live-events).
//
// It lives in this process's memory, which is right while the service runs as one instance.
// With several instances, an open recorded by one wouldn't reach streams held by another;
// Postgres LISTEN/NOTIFY would be the next step then.

export interface TrackerOpenedEvent {
  type: 'tracker-opened'
  trackerId: string
  /** The hit that caused it; also the notification's id */
  notificationId: string
  /** true the first time the email is opened, false when it's opened again */
  firstOpen: boolean
  openedAt: string
}

export type LiveEvent = TrackerOpenedEvent

const emitter = new EventEmitter()
// One listener per open browser tab; the default warning at 10 is meant for leaks, not this
emitter.setMaxListeners(0)

/** Sends an event to every open stream of this user. */
export function publish(userId: string, event: LiveEvent): void {
  emitter.emit(userId, event)
}

/** Calls `listener` for each event of this user. Returns a function that stops listening. */
export function subscribe(userId: string, listener: (event: LiveEvent) => void): () => void {
  emitter.on(userId, listener)
  return () => emitter.off(userId, listener)
}
