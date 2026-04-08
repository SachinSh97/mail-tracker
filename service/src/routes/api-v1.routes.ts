import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { authRouter, publicAuthRouter } from '../modules/auth/auth.routes.js'
import { collectionRouter } from '../modules/collections/collection.routes.js'

export const apiV1Router = Router()

// Public
apiV1Router.use('/', publicAuthRouter) // POST /api/v1/auth/google

// Everything below requires a signed-in user
apiV1Router.use(authenticate)

apiV1Router.use('/', authRouter) // GET /api/v1/me
apiV1Router.use('/collections', collectionRouter)
