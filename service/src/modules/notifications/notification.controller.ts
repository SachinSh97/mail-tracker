import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as notificationService from './notification.service.js'
import { listNotificationsQuerySchema, markSeenSchema } from './notification.validation.js'

// GET /api/v1/notifications — newest first, each with `unread`
export async function listNotifications(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const query = listNotificationsQuerySchema.parse(req.query)
  res.json(await notificationService.listNotifications(userId, query))
}

// GET /api/v1/notifications/unread-count — { count }
export async function countUnread(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  res.json(await notificationService.countUnread(userId))
}

// POST /api/v1/notifications/seen — { seenUntil }
export async function markSeen(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { seenUntil } = markSeenSchema.parse(req.body)
  await notificationService.markSeen(userId, seenUntil)
  res.status(204).end()
}
