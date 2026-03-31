import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './shared/logger.js'

// Entry point: starts the HTTP server and shuts it down cleanly.
const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Mail Tracker service running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

// Render sends SIGTERM before stopping/redeploying; Ctrl+C sends SIGINT.
// Stop taking new requests and let current ones finish.
let shuttingDown = false

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info(`${signal} received, shutting down…`)

  // Don't hang forever if something refuses to close
  setTimeout(() => {
    logger.error('Forced shutdown after 10s')
    process.exit(1)
  }, 10_000).unref()

  server.close(() => {
    logger.info('Shutdown complete')
    process.exit(0)
  })
  // Long-lived connections (e.g. SSE streams) would otherwise keep the server open
  server.closeAllConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
