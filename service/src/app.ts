import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error-handler.js'
import { notFoundHandler } from './middlewares/not-found-handler.js'
import { rejectCrossSiteWrites } from './middlewares/reject-cross-site-writes.js'
import { healthRouter } from './modules/health/health.routes.js'
import { trackingRouter } from './modules/tracking/tracking.routes.js'
import { apiV1Router } from './routes/api-v1.routes.js'
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
  // The web app normally calls the API from the same site (Vite's proxy in development), which needs no CORS.
  // Origins listed in CORS_ORIGINS may also call it, with cookies. Every other website is refused.
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }))
  app.use(cookieParser()) // reads the session cookie into req.cookies
  app.use(express.json({ limit: '100kb' })) // parse JSON bodies

  // --- Routes ---
  app.use('/health', healthRouter)
  app.use('/api/v1', rejectCrossSiteWrites, apiV1Router) // private: needs a logged-in user
  app.use('/t', trackingRouter) // public: the links inside emails

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
