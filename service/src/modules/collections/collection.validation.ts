import { z } from 'zod'
import { paginationQuerySchema } from '../../shared/pagination.js'

const emptyToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value)

const name = z.string().trim().min(1, { message: 'is required' }).max(100)
const description = z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional())

// URL params: /collections/:collectionId
export const collectionParamsSchema = z.object({
  collectionId: z.uuid({ message: 'is not a valid collection id' }),
})

// POST /api/v1/collections
export const createCollectionSchema = z.strictObject({ name, description })

// PATCH /api/v1/collections/:collectionId — send only what you want to change
export const updateCollectionSchema = z
  .strictObject({ name: name.optional(), description })
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field to update' })

// GET /api/v1/collections?limit=20&offset=0
export const listCollectionsQuerySchema = paginationQuerySchema

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
