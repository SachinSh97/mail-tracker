import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as liveEventsBus from './live-events.bus.js'

// Proxies close connections that stay silent too long, so we send a comment line this often
const HEARTBEAT_MS = 25_000
// How long the browser waits before reconnecting after the stream drops
const RECONNECT_DELAY_MS = 5_000

// GET /api/v1/live-events
// A Server-Sent Events stream: the connection stays open and the server writes one message per event,
//   event: tracker-opened
//   data: {"type":"tracker-opened","trackerId":"…","notificationId":"…","firstOpen":true,"openedAt":"…"}
// The browser's EventSource reconnects by itself if it drops.
export function streamLiveEvents(req: Request, res: Response): void {
  const { id: userId } = getCurrentUser(req)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    // Never cache, and don't let proxies compress or buffer the stream (that would delay events)
    'Cache-Control': 'no-cache, no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write(`retry: ${RECONNECT_DELAY_MS}\n\n`)

  const unsubscribe = liveEventsBus.subscribe(userId, (event) => {
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
  })
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS)

  // The tab was closed, the user navigated away, or the network dropped
  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
}
