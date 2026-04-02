import { Router } from 'express'
import { getHealth } from './health.controller.js'

// Public: no API key, so Render and the keep-alive pinger can call it.
export const healthRouter = Router()

healthRouter.get('/', getHealth)
