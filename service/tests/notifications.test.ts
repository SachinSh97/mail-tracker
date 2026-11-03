import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/database/prisma-client.js'
import { api, asOwner, createSomeoneElsesTracker, resetDatabase } from './helpers.js'

beforeEach(resetDatabase)

// A recipient opening the email in Gmail (see tracking.test.ts)
const asRecipient = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)',
  'X-Forwarded-For': '203.0.113.7',
}
const asBot = { 'User-Agent': 'Barracuda Sentinel scanner', 'X-Forwarded-For': '203.0.113.8' }

/** A tracker that is past its grace period, i.e. the email has been sent. */
async function createSentTracker(name = 'Razorpay – HR'): Promise<string> {
  const { body } = await api().post('/api/v1/trackers').set(asOwner).send({ name })
  await prisma.tracker.update({
    where: { id: body.id },
    data: { createdAt: new Date(Date.now() - 10 * 60_000), creatorIp: '198.51.100.1' },
  })
  return body.id
}

const openEmail = (trackerId: string, headers: Record<string, string> = asRecipient) =>
  api().get(`/t/${trackerId}/pixel.gif`).set(headers)

const listNotifications = () => api().get('/api/v1/notifications').set(asOwner)
const unreadCount = async () =>
  (await api().get('/api/v1/notifications/unread-count').set(asOwner)).body.count
const markSeen = (seenUntil: string) =>
  api().post('/api/v1/notifications/seen').set(asOwner).send({ seenUntil })

describe('Notifications list', () => {
  it('has one notification per real open, newest first, with the email it belongs to', async () => {
    const id = await createSentTracker()
    await openEmail(id)
    await openEmail(id)

    const res = await listNotifications()
    expect(res.status).toBe(200)
    expect(res.body.pagination.total).toBe(2)
    expect(res.body.items.map((n: { firstOpen: boolean }) => n.firstOpen)).toEqual([false, true])
    expect(res.body.items[0]).toMatchObject({ unread: true, tracker: { id, name: 'Razorpay – HR' } })
  })

  it('ignores loads that are not real opens (bots, the sender, the grace period)', async () => {
    const id = await createSentTracker()
    await openEmail(id, asBot)
    await openEmail(id, { ...asRecipient, 'X-Forwarded-For': '198.51.100.1' }) // the sender's own IP

    expect((await listNotifications()).body.items).toEqual([])
  })

  it("never includes other people's emails", async () => {
    const theirs = await createSomeoneElsesTracker()
    await prisma.tracker.update({
      where: { id: theirs },
      data: { createdAt: new Date(Date.now() - 10 * 60_000) },
    })
    await openEmail(theirs)

    expect((await listNotifications()).body.pagination.total).toBe(0)
    expect(await unreadCount()).toBe(0)
  })

  it('disappear when their tracker is deleted', async () => {
    const id = await createSentTracker()
    await openEmail(id)
    await api().delete(`/api/v1/trackers/${id}`).set(asOwner)

    expect((await listNotifications()).body.pagination.total).toBe(0)
  })

  it('needs a signed-in user', async () => {
    expect((await api().get('/api/v1/notifications')).status).toBe(401)
    expect((await api().get('/api/v1/notifications/unread-count')).status).toBe(401)
  })
})

describe('Unread count and marking as seen', () => {
  it('counts everything as unread until the user first looks', async () => {
    const id = await createSentTracker()
    await openEmail(id)
    await openEmail(id)
    expect(await unreadCount()).toBe(2)
  })

  it('marks notifications up to the given time as seen; later ones stay unread', async () => {
    const id = await createSentTracker()
    await openEmail(id)
    const [seen] = (await listNotifications()).body.items

    expect((await markSeen(seen.createdAt)).status).toBe(204)
    expect(await unreadCount()).toBe(0)

    await openEmail(id) // arrives after the user looked
    expect(await unreadCount()).toBe(1)
    const [newest, older] = (await listNotifications()).body.items
    expect(newest.unread).toBe(true)
    expect(older.unread).toBe(false)
  })

  it('never moves the mark backwards (a slower request from another tab)', async () => {
    const id = await createSentTracker()
    await openEmail(id)
    await markSeen(new Date().toISOString())
    await markSeen('2000-01-01T00:00:00.000Z')

    expect(await unreadCount()).toBe(0)
  })

  it('treats a time in the future as now', async () => {
    const id = await createSentTracker()
    await markSeen('2999-01-01T00:00:00.000Z')
    await openEmail(id)

    expect(await unreadCount()).toBe(1)
  })

  it('rejects a missing or invalid date', async () => {
    expect((await api().post('/api/v1/notifications/seen').set(asOwner).send({})).status).toBe(400)
    expect((await markSeen('not a date')).status).toBe(400)
  })
})

describe('Live events (Server-Sent Events)', () => {
  // Streams need a real server: supertest waits for the response to end, and this one never does
  let server: ReturnType<ReturnType<typeof createApp>['listen']>
  let baseUrl = ''
  let controller: AbortController

  beforeEach(async () => {
    controller = new AbortController()
    server = createApp().listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterEach(async () => {
    controller.abort()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  /** Opens the stream and resolves with the first event whose text contains `marker` */
  async function waitForEvent(response: Response, marker: string): Promise<string> {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let text = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) throw new Error('Stream ended before the event arrived')
      text += decoder.decode(value, { stream: true })
      const event = text.split('\n\n').find((block) => block.includes(marker))
      if (event) return event
    }
  }

  it('streams a tracker-opened event to the owner when their email is opened', async () => {
    const id = await createSentTracker()
    const stream = await fetch(`${baseUrl}/api/v1/live-events`, {
      headers: asOwner,
      signal: controller.signal,
    })
    expect(stream.status).toBe(200)
    expect(stream.headers.get('content-type')).toContain('text/event-stream')

    const event = waitForEvent(stream, 'tracker-opened')
    await openEmail(id)

    const [eventLine, dataLine] = (await event).split('\n')
    expect(eventLine).toBe('event: tracker-opened')
    expect(JSON.parse(dataLine?.replace('data: ', '') ?? '')).toMatchObject({
      trackerId: id,
      firstOpen: true,
    })
  })

  it('refuses to stream without a signed-in user', async () => {
    const res = await fetch(`${baseUrl}/api/v1/live-events`, { signal: controller.signal })
    expect(res.status).toBe(401)
  })
})
