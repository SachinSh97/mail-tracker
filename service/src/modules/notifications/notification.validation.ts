import { z } from 'zod'
import { paginationQuerySchema } from '../../shared/pagination.js'

// GET /api/v1/notifications?limit=50&offset=0
export const listNotificationsQuerySchema = paginationQuerySchema

// POST /api/v1/notifications/seen   { "seenUntil": "2026-11-08T10:58:00.000Z" }
export const markSeenSchema = z.strictObject({
  /** Time of the newest notification the user has seen */
  seenUntil: z.coerce.date({ message: 'must be a date' }),
})
