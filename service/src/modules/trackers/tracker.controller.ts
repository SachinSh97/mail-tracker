import type { Request, Response } from 'express'
import { getCurrentUser } from '../../middlewares/authenticate.js'
import * as trackerService from './tracker.service.js'
import {
  createTrackerSchema,
  listTrackersQuerySchema,
  trackerParamsSchema,
  updateTrackerSchema,
} from './tracker.validation.js'

// POST /api/v1/trackers — returns the tracker, including the pixel to insert into the email
export async function createTracker(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const input = createTrackerSchema.parse(req.body ?? {})
  res.status(201).json(await trackerService.createTracker(userId, input, req.ip ?? null))
}

// GET /api/v1/trackers?collectionId=…&status=opened
export async function listTrackers(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const query = listTrackersQuerySchema.parse(req.query)
  res.json(await trackerService.listTrackers(userId, query))
}

// GET /api/v1/trackers/:trackerId — includes its hits
export async function getTracker(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { trackerId } = trackerParamsSchema.parse(req.params)
  res.json(await trackerService.getTracker(userId, trackerId))
}

// PATCH /api/v1/trackers/:trackerId
export async function updateTracker(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { trackerId } = trackerParamsSchema.parse(req.params)
  const changes = updateTrackerSchema.parse(req.body)
  res.json(await trackerService.updateTracker(userId, trackerId, changes))
}

// DELETE /api/v1/trackers/:trackerId
export async function deleteTracker(req: Request, res: Response): Promise<void> {
  const { id: userId } = getCurrentUser(req)
  const { trackerId } = trackerParamsSchema.parse(req.params)
  await trackerService.deleteTracker(userId, trackerId)
  res.status(204).end()
}
