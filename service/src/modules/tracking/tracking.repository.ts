import { prisma } from '../../database/prisma-client.js'
import type { HitOutcome } from '../../generated/prisma/client.js'

/** Only what the tracking rules need. The public pixel never loads anything else. */
export function findTrackerForHit(trackerId: string) {
  return prisma.tracker.findUnique({
    where: { id: trackerId },
    select: { id: true, creatorIp: true, createdAt: true },
  })
}

export interface NewHit {
  trackerId: string
  ipAddress: string | null
  userAgent: string | null
}

/** Saves a hit that our rules decided to ignore. */
export async function saveIgnoredHit(hit: NewHit, outcome: HitOutcome): Promise<HitOutcome> {
  await prisma.hit.create({ data: { ...hit, outcome } })
  return outcome
}

/**
 * Tries to mark the tracker as opened, then saves the hit.
 *
 * "Only once" is guaranteed by the database: the UPDATE only matches while opened_at is still
 * empty, so if two hits arrive at the same moment, exactly one of them changes the row.
 */
export function saveOpenCandidateHit(hit: NewHit): Promise<HitOutcome> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.tracker.updateMany({
      where: { id: hit.trackerId, openedAt: null },
      data: { openedAt: new Date() },
    })
    const outcome: HitOutcome = count === 1 ? 'COUNTED_AS_OPEN' : 'ALREADY_OPENED'

    await tx.hit.create({ data: { ...hit, outcome } })
    return outcome
  })
}
