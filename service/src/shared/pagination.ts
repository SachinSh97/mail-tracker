import { z } from 'zod'

// Query params shared by every list endpoint: ?limit=20&offset=40
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// Every list endpoint responds with the same shape:
// { "items": [...], "pagination": { "limit": 20, "offset": 0, "total": 57 } }
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationQuery & { total: number }
}

export function paginated<T>(items: T[], query: PaginationQuery, total: number): PaginatedResponse<T> {
  return { items, pagination: { ...query, total } }
}
