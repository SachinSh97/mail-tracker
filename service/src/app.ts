import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { errorHandler } from './middlewares/error-handler.js'
import { notFoundHandler } from './middlewares/not-found-handler.js'
import { logger } from './shared/logger.js'

// Builds the Express app without starting it, so tests can use it directly.
export function createApp(): Express {
  const app = express()

  // Render (and most hosts) put a proxy in front of us. Trusting the first proxy
  // makes req.ip the visitor's real IP, which we need to recognise your own hits.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  // --- Middleware that runs on every request ---
  // Logging goes first so every request is logged, even ones that fail while parsing.
  app.use(
    pinoHttp({
      logger,
      // Don't flood the logs with keep-alive pings
      autoLogging: { ignore: (req) => req.url === '/health' },
      // One short line per request: "GET /t/abc/pixel.gif → 200 (4ms)"
      serializers: {
        req: (req) => ({ method: req.method, url: fullUrl(req) }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      customSuccessMessage: (req, res, ms) =>
        `${req.method} ${fullUrl(req)} → ${res.statusCode} (${Math.round(ms)}ms)`,
      customErrorMessage: (req, res) => `${req.method} ${fullUrl(req)} → ${res.statusCode}`,
      customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? 'error' : 'info'),
    }),
  )

  app.use(
    helmet({
      // Helmet blocks other websites from loading our files by default. Our tracking pixel is
      // loaded from inside mail apps (other origins), so allow it.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors()) // allow calls from any future frontend
  app.use(express.json({ limit: '100kb' })) // parse JSON bodies

  // --- Must stay last ---
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

// Inside sub-routers Express shortens req.url ("/api/v1/me" becomes "/me").
// originalUrl always has the full path, so logs show what was really called.
function fullUrl(req: { url?: string; originalUrl?: string }): string | undefined {
  return req.originalUrl ?? req.url
}
