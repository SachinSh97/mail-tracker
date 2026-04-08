import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as collectionService from './collection.service.js'
import {
  collectionParamsSchema,
  createCollectionSchema,
  listCollectionsQuerySchema,
  updateCollectionSchema,
} from './collection.validation.js'

// POST /api/v1/collections
export async function createCollection(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const input = createCollectionSchema.parse(req.body)
  res.status(201).json(await collectionService.createCollection(userId, input))
}

// GET /api/v1/collections
export async function listCollections(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const query = listCollectionsQuerySchema.parse(req.query)
  res.json(await collectionService.listCollections(userId, query))
}

// GET /api/v1/collections/:collectionId
export async function getCollection(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { collectionId } = collectionParamsSchema.parse(req.params)
  res.json(await collectionService.getCollection(userId, collectionId))
}

// PATCH /api/v1/collections/:collectionId
export async function updateCollection(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { collectionId } = collectionParamsSchema.parse(req.params)
  const changes = updateCollectionSchema.parse(req.body)
  res.json(await collectionService.updateCollection(userId, collectionId, changes))
}

// DELETE /api/v1/collections/:collectionId
export async function deleteCollection(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { collectionId } = collectionParamsSchema.parse(req.params)
  await collectionService.deleteCollection(userId, collectionId)
  res.status(204).end()
}
