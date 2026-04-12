import { Router } from 'express'
import * as trackerController from './tracker.controller.js'

export const trackerRouter = Router()

trackerRouter.post('/', trackerController.createTracker)
trackerRouter.get('/', trackerController.listTrackers)
trackerRouter.get('/:trackerId', trackerController.getTracker)
trackerRouter.patch('/:trackerId', trackerController.updateTracker)
trackerRouter.delete('/:trackerId', trackerController.deleteTracker)
