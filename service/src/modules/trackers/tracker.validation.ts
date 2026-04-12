import { z } from 'zod'
import { paginationQuerySchema } from '../../shared/pagination.js'
import { TRACKER_ID_PATTERN } from './tracker-id.js'

const emptyToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value)

const name = z.string().trim().min(1, { message: 'cannot be empty' }).max(150)
const emailSubject = z.preprocess(emptyToNull, z.string().trim().max(300).nullable().optional())

// To + CC + BCC from the draft. Lowercased and de-duplicated.
const recipientEmails = z
  .array(z.email({ message: 'must be a valid email address' }).trim().toLowerCase())
  .max(50)
  .transform((emails) => [...new Set(emails)])

// null removes the tracker from its collection
const collectionId = z.uuid({ message: 'is not a valid collection id' }).nullable().optional()

// URL params: /trackers/:trackerId
export const trackerParamsSchema = z.object({
  trackerId: z.string().regex(TRACKER_ID_PATTERN, { message: 'is not a valid tracker id' }),
})

// POST /api/v1/trackers
// Everything is optional so the web app can create a tracker with a single click.
export const createTrackerSchema = z.strictObject({
  name: name.optional(), // defaults to the subject, then the first recipient
  emailSubject,
  recipientEmails: recipientEmails.default([]),
  collectionId,
})

// PATCH /api/v1/trackers/:trackerId — send only what you want to change
export const updateTrackerSchema = z
  .strictObject({
    name: name.optional(),
    emailSubject,
    recipientEmails: recipientEmails.optional(),
    collectionId,
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field to update' })

// GET /api/v1/trackers?collectionId=…&status=opened&limit=20&offset=0
export const listTrackersQuerySchema = paginationQuerySchema.extend({
  // A collection id, or "none" for trackers that aren't in any collection
  collectionId: z
    .union([z.literal('none'), z.uuid({ message: 'must be a collection id or "none"' })])
    .optional(),
  status: z.enum(['opened', 'not-opened']).optional(),
})

export type CreateTrackerInput = z.infer<typeof createTrackerSchema>
export type UpdateTrackerInput = z.infer<typeof updateTrackerSchema>
export type ListTrackersQuery = z.infer<typeof listTrackersQuerySchema>
