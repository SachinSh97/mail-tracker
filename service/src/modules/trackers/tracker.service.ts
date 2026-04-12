import { Prisma, type HitOutcome } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/http-errors.js'
import { paginated, type PaginatedResponse } from '../../shared/pagination.js'
import { getOwnedCollectionOrThrow } from '../collections/collection.service.js'
import { generateTrackerId } from './tracker-id.js'
import { buildTrackerPixel, type TrackerPixel } from './tracker-pixel.js'
import * as trackerRepository from './tracker.repository.js'
import type { TrackerRecord, TrackerWithHitsRecord } from './tracker.repository.js'
import type { CreateTrackerInput, ListTrackersQuery, UpdateTrackerInput } from './tracker.validation.js'

// What the API returns for a tracker
export interface TrackerResponse {
  id: string
  name: string
  emailSubject: string | null
  recipientEmails: string[]
  collection: { id: string; name: string } | null
  status: 'opened' | 'not-opened'
  openedAt: Date | null
  createdAt: Date
  /** What the user copies from the web app and pastes into the email */
  pixel: TrackerPixel
}

export interface HitResponse {
  id: string
  outcome: HitOutcome
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export type TrackerDetailsResponse = TrackerResponse & { hits: HitResponse[] }

/**
 * Creates a tracker. The response includes `pixel.html`, ready to insert into the email.
 * `creatorIp` is remembered so that later, hits from the same computer (you) can be ignored.
 */
export async function createTracker(
  userId: string,
  input: CreateTrackerInput,
  creatorIp: string | null,
): Promise<TrackerResponse> {
  if (input.collectionId) await getOwnedCollectionOrThrow(userId, input.collectionId)

  const tracker = await insertWithUniqueId({
    userId,
    name: input.name ?? defaultTrackerName(input),
    emailSubject: input.emailSubject ?? null,
    recipientEmails: input.recipientEmails,
    collectionId: input.collectionId ?? null,
    creatorIp,
  })
  return toTrackerResponse(tracker)
}

export async function listTrackers(
  userId: string,
  query: ListTrackersQuery,
): Promise<PaginatedResponse<TrackerResponse>> {
  const { trackers, total } = await trackerRepository.listTrackers(userId, query)
  return paginated(trackers.map(toTrackerResponse), query, total)
}

export async function getTracker(userId: string, trackerId: string): Promise<TrackerDetailsResponse> {
  const tracker = await trackerRepository.findOwnedTrackerWithHits(userId, trackerId)
  if (!tracker) throw new NotFoundError('Tracker not found')
  return toTrackerDetailsResponse(tracker)
}

export async function updateTracker(
  userId: string,
  trackerId: string,
  changes: UpdateTrackerInput,
): Promise<TrackerResponse> {
  await getOwnedTrackerOrThrow(userId, trackerId)
  if (changes.collectionId) await getOwnedCollectionOrThrow(userId, changes.collectionId)

  const tracker = await trackerRepository.updateTracker(trackerId, changes)
  return toTrackerResponse(tracker)
}

export async function deleteTracker(userId: string, trackerId: string): Promise<void> {
  await getOwnedTrackerOrThrow(userId, trackerId)
  await trackerRepository.deleteTracker(trackerId)
}

// ---------------------------------------------------------------------------

async function getOwnedTrackerOrThrow(userId: string, trackerId: string): Promise<TrackerRecord> {
  const tracker = await trackerRepository.findOwnedTracker(userId, trackerId)
  if (!tracker) throw new NotFoundError('Tracker not found')
  return tracker
}

// Random ids practically never collide, but if one does, just try a new id
async function insertWithUniqueId(data: Omit<trackerRepository.NewTracker, 'id'>): Promise<TrackerRecord> {
  const MAX_ATTEMPTS = 3
  for (let attempt = 1; ; attempt++) {
    try {
      return await trackerRepository.createTracker({ id: generateTrackerId(), ...data })
    } catch (error) {
      const isDuplicateId = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      if (!isDuplicateId || attempt >= MAX_ATTEMPTS) throw error
    }
  }
}

// A name the user will recognise, without having to type one
function defaultTrackerName(input: CreateTrackerInput): string {
  return input.emailSubject ?? input.recipientEmails[0] ?? 'Untitled tracker'
}

function toTrackerResponse(tracker: TrackerRecord): TrackerResponse {
  return {
    id: tracker.id,
    name: tracker.name,
    emailSubject: tracker.emailSubject,
    recipientEmails: tracker.recipientEmails,
    collection: tracker.collection,
    status: tracker.openedAt ? 'opened' : 'not-opened',
    openedAt: tracker.openedAt,
    createdAt: tracker.createdAt,
    pixel: buildTrackerPixel(tracker.id),
  }
}

function toTrackerDetailsResponse(tracker: TrackerWithHitsRecord): TrackerDetailsResponse {
  return { ...toTrackerResponse(tracker), hits: tracker.hits }
}
