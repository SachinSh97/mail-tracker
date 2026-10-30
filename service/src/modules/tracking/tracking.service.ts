import { env } from '../../config/env.js'
import type { HitOutcome } from '../../generated/prisma/client.js'
import { logger } from '../../shared/logger.js'
import * as liveEventsBus from '../live-events/live-events.bus.js'
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
    if (classification !== 'MAY_COUNT_AS_OPEN') {
      return await trackingRepository.saveIgnoredHit(hit, classification)
    }

    // A real open (the first one, or the email opened again): tell the owner's open tabs right away
    const saved = await trackingRepository.saveOpenCandidateHit(hit)
    const firstOpen = saved.outcome === 'COUNTED_AS_OPEN'
    if (firstOpen) logger.info({ trackerId }, `📬 Tracker ${trackerId} opened`)

    liveEventsBus.publish(tracker.userId, {
      type: 'tracker-opened',
      trackerId,
      notificationId: saved.id,
      firstOpen,
      openedAt: saved.createdAt.toISOString(),
    })
    return saved.outcome
  } catch (error) {
    logger.error({ err: error, trackerId }, 'Failed to record pixel hit')
    return null
  }
}
