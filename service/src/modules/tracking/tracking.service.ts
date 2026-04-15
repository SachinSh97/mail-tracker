import { env } from '../../config/env.js'
import type { HitOutcome } from '../../generated/prisma/client.js'
import { logger } from '../../shared/logger.js'
import { TRACKER_ID_PATTERN } from '../trackers/tracker-id.js'
import { classifyHit } from './hit-rules.js'
import * as trackingRepository from './tracking.repository.js'

export interface Visitor {
  method: string
  ip: string | undefined
  userAgent: string | undefined
}

const MAX_USER_AGENT_LENGTH = 500

/**
 * Records one load of a tracker's pixel.
 * Returns what was saved, or null if nothing was (unknown tracker, HEAD request, or a database error).
 * Never throws: a tracking problem must never break the email.
 */
export async function recordPixelHit(trackerId: string, visitor: Visitor): Promise<HitOutcome | null> {
  if (!TRACKER_ID_PATTERN.test(trackerId)) return null

  try {
    const tracker = await trackingRepository.findTrackerForHit(trackerId)
    if (!tracker) return null

    const classification = classifyHit({
      method: visitor.method,
      userAgent: visitor.userAgent,
      visitorIp: visitor.ip,
      trackerCreatorIp: tracker.creatorIp,
      trackerCreatedAt: tracker.createdAt,
      now: new Date(),
      gracePeriodSeconds: env.TRACKING_GRACE_PERIOD_SECONDS,
    })
    if (classification === 'NOT_RECORDED') return null

    const hit = {
      trackerId,
      ipAddress: visitor.ip ?? null,
      userAgent: visitor.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    }
    const outcome =
      classification === 'MAY_COUNT_AS_OPEN'
        ? await trackingRepository.saveOpenCandidateHit(hit)
        : await trackingRepository.saveIgnoredHit(hit, classification)

    if (outcome === 'COUNTED_AS_OPEN') {
      logger.info({ trackerId }, `📬 Tracker ${trackerId} opened`)
      // Next part: publish a live event here (SSE)
    }
    return outcome
  } catch (error) {
    logger.error({ err: error, trackerId }, 'Failed to record pixel hit')
    return null
  }
}
