import { Router } from 'express'
import { streamLiveEvents } from './live-events.controller.js'

export const liveEventsRouter = Router()

liveEventsRouter.get('/', streamLiveEvents)
