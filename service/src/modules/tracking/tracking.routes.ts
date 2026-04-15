import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as trackingController from './tracking.controller.js'

// Public routes, mounted at /t. The pixel URL is what goes into the email.
export const trackingRouter = Router()

// Stops anyone from flooding the tracker. Generous, because many recipients
// can share one IP (e.g. everyone behind Gmail's image proxy).
trackingRouter.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

// Express also answers HEAD requests with this GET handler
trackingRouter.get('/:trackerId/pixel.gif', trackingController.openPixel)
