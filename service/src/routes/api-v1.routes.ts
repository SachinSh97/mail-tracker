import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { limitWrites } from '../middlewares/limit-writes.js'
import { authRouter, publicAuthRouter } from '../modules/auth/auth.routes.js'
import { collectionRouter } from '../modules/collections/collection.routes.js'
import { liveEventsRouter } from '../modules/live-events/live-events.routes.js'
import { notificationRouter } from '../modules/notifications/notification.routes.js'
import { trackerRouter } from '../modules/trackers/tracker.routes.js'

export const apiV1Router = Router()

// Public
apiV1Router.use('/', publicAuthRouter) // POST /api/v1/auth/google

// Everything below requires a signed-in user
apiV1Router.use(authenticate)
apiV1Router.use(limitWrites)

apiV1Router.use('/', authRouter) // GET /api/v1/me
apiV1Router.use('/collections', collectionRouter)
apiV1Router.use('/trackers', trackerRouter)
apiV1Router.use('/notifications', notificationRouter)
apiV1Router.use('/live-events', liveEventsRouter) // Server-Sent Events stream
