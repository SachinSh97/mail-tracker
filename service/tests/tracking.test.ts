import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/database/prisma-client.js'
import { api, asOwner, resetDatabase } from './helpers.js'

beforeEach(resetDatabase)

// A recipient opening the email in Gmail, from a different IP than the one that created the tracker.
// The app trusts one proxy hop, so X-Forwarded-For sets the visitor IP (like Render does).
const GMAIL_PROXY =
  'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)'
const asRecipient = { 'User-Agent': GMAIL_PROXY, 'X-Forwarded-For': '203.0.113.7' }

/** Creates a tracker that is past its grace period, i.e. the email has been sent. */
async function createSentTracker(): Promise<string> {
  const { body } = await api().post('/api/v1/trackers').set(asOwner).send({ name: 'Razorpay – HR' })
  await prisma.tracker.update({
    where: { id: body.id },
    data: { createdAt: new Date(Date.now() - 10 * 60_000), creatorIp: '198.51.100.1' },
  })
  return body.id
}

const loadPixel = (trackerId: string, headers: Record<string, string> = asRecipient) =>
  api().get(`/t/${trackerId}/pixel.gif`).set(headers)

const findTracker = (id: string) => prisma.tracker.findUniqueOrThrow({ where: { id } })
const listOutcomes = async (trackerId: string) =>
  (await prisma.hit.findMany({ where: { trackerId }, orderBy: { createdAt: 'asc' } })).map((h) => h.outcome)

describe('Pixel response', () => {
  it('returns a 1×1 transparent GIF that is never cached', async () => {
    const id = await createSentTracker()
    const res = await loadPixel(id)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/gif')
    expect(res.headers['cache-control']).toContain('no-store')
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow')
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin') // loadable inside mail apps
    expect(res.body.subarray(0, 6).toString()).toBe('GIF89a')
  })

  it('still returns the image for unknown or malformed tracker ids, without saving anything', async () => {
    expect((await loadPixel('AAAAAAAAAAAA')).status).toBe(200)
    expect((await loadPixel('bad')).status).toBe(200)
    expect(await prisma.hit.count()).toBe(0)
  })

  it('has no other tracking routes in this version', async () => {
    const id = await createSentTracker()
    for (const removed of ['linkedin', 'github', 'resume']) {
      expect((await api().get(`/t/${id}/${removed}`).set(asRecipient)).status).toBe(404)
    }
  })
})

describe('Opened, only once', () => {
  it('marks the tracker opened on the first real load, and saves the hit', async () => {
    const id = await createSentTracker()
    await loadPixel(id)

    expect((await findTracker(id)).openedAt).not.toBeNull()
    const [hit] = await prisma.hit.findMany({ where: { trackerId: id } })
    expect(hit).toMatchObject({ outcome: 'COUNTED_AS_OPEN', ipAddress: '203.0.113.7' })
    expect(hit?.userAgent).toContain('GoogleImageProxy')
  })

  it('later loads are logged as ALREADY_OPENED and do not move the opened time', async () => {
    const id = await createSentTracker()
    await loadPixel(id)
    const firstOpenedAt = (await findTracker(id)).openedAt
    await loadPixel(id)
    await loadPixel(id)

    expect((await findTracker(id)).openedAt).toEqual(firstOpenedAt)
    expect(await listOutcomes(id)).toEqual(['COUNTED_AS_OPEN', 'ALREADY_OPENED', 'ALREADY_OPENED'])
  })

  it('counts exactly one open when many loads arrive at the same moment', async () => {
    const id = await createSentTracker()

    await Promise.all(Array.from({ length: 10 }, () => loadPixel(id)))

    const outcomes = await listOutcomes(id)
    expect(outcomes).toHaveLength(10)
    expect(outcomes.filter((o) => o === 'COUNTED_AS_OPEN')).toHaveLength(1)
  })
})

describe('Ignored loads', () => {
  it('ignores loads during the grace period (e.g. your own draft)', async () => {
    const { body } = await api().post('/api/v1/trackers').set(asOwner).send({})
    await loadPixel(body.id)

    expect((await findTracker(body.id)).openedAt).toBeNull()
    expect(await listOutcomes(body.id)).toEqual(['IGNORED_GRACE_PERIOD'])
  })

  it('ignores the owner, recognised by the IP that created the tracker', async () => {
    const id = await createSentTracker()
    await loadPixel(id, { ...asRecipient, 'X-Forwarded-For': '198.51.100.1' })

    expect((await findTracker(id)).openedAt).toBeNull()
    expect(await listOutcomes(id)).toEqual(['IGNORED_OWNER'])
  })

  it('ignores security scanners and bots', async () => {
    const id = await createSentTracker()
    await loadPixel(id, { ...asRecipient, 'User-Agent': 'Barracuda Sentinel (EE)' })

    expect((await findTracker(id)).openedAt).toBeNull()
    expect(await listOutcomes(id)).toEqual(['IGNORED_BOT'])
  })

  it('does not record HEAD requests at all', async () => {
    const id = await createSentTracker()
    const res = await api().head(`/t/${id}/pixel.gif`).set(asRecipient)

    expect(res.status).toBe(200)
    expect(await prisma.hit.count()).toBe(0)
  })

  it('an ignored load does not block the real open that comes later', async () => {
    const id = await createSentTracker()
    await loadPixel(id, { ...asRecipient, 'User-Agent': 'Barracuda Sentinel (EE)' })
    await loadPixel(id)

    expect((await findTracker(id)).openedAt).not.toBeNull()
    expect(await listOutcomes(id)).toEqual(['IGNORED_BOT', 'COUNTED_AS_OPEN'])
  })
})

describe('Status in the API', () => {
  it('the owner sees the tracker as opened, with its hits', async () => {
    const id = await createSentTracker()
    await loadPixel(id)

    const res = await api().get(`/api/v1/trackers/${id}`).set(asOwner)
    expect(res.body.status).toBe('opened')
    expect(res.body.hits).toHaveLength(1)
  })
})
