import { Router } from 'express'
import * as notificationController from './notification.controller.js'

export const notificationRouter = Router()

notificationRouter.get('/', notificationController.listNotifications)
notificationRouter.get('/unread-count', notificationController.countUnread)
notificationRouter.post('/seen', notificationController.markSeen)
