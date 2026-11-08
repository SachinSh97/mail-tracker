import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/database/prisma-client.js'
import {
  api,
  asOwner,
  createSomeoneElsesCollection,
  createSomeoneElsesTracker,
  resetDatabase,
} from './helpers.js'

beforeEach(resetDatabase)

describe('Create tracker', () => {
  it('works with an empty body (one click in the web app)', async () => {
    const res = await api().post('/api/v1/trackers').set(asOwner).send({})

    expect(res.status).toBe(201)
    expect(res.body.id).toMatch(/^[A-Za-z0-9_-]{12}$/)
    expect(res.body).toMatchObject({
      name: 'Untitled tracker',
      status: 'not-opened',
      openedAt: null,
      recipientEmails: [],
      collection: null,
    })
  })

  it('returns the pixel, ready to insert into the email', async () => {
    const res = await api().post('/api/v1/trackers').set(asOwner).send({})
    const url = `https://tracker.test/t/${res.body.id}/pixel.gif`

    expect(res.body.pixel.url).toBe(url)
    expect(res.body.pixel.html).toBe(
      `<img src="${url}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`,
    )
  })

  it('names the tracker after the subject, then the first recipient', async () => {
    const bySubject = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ emailSubject: 'Senior Frontend role', recipientEmails: ['hr@razorpay.com'] })
    expect(bySubject.body.name).toBe('Senior Frontend role')

    const byRecipient = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ recipientEmails: ['HR@Razorpay.com', 'hr@razorpay.com', 'lead@razorpay.com'] })
    expect(byRecipient.body.name).toBe('hr@razorpay.com')
    expect(byRecipient.body.recipientEmails).toEqual(['hr@razorpay.com', 'lead@razorpay.com']) // lowercased + deduped
  })

  it('remembers the creator IP internally but never returns it', async () => {
    const res = await api().post('/api/v1/trackers').set(asOwner).send({})
    const row = await prisma.tracker.findUnique({ where: { id: res.body.id } })

    expect(row?.creatorIp).toBeTruthy()
    expect(res.body).not.toHaveProperty('creatorIp')
  })

  it('rejects invalid input and someone else’s collection', async () => {
    const badEmail = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ recipientEmails: ['not-an-email'] })
    expect(badEmail.status).toBe(400)

    const unknownField = await api().post('/api/v1/trackers').set(asOwner).send({ includeResumeLink: true })
    expect(unknownField.status).toBe(400)

    const theirs = await createSomeoneElsesCollection()
    const res = await api().post('/api/v1/trackers').set(asOwner).send({ collectionId: theirs })
    expect(res.status).toBe(404)
  })
})

describe('List, read, update, delete trackers', () => {
  it('filters by collection, standalone and status', async () => {
    const collection = await api().post('/api/v1/collections').set(asOwner).send({ name: 'Razorpay' })
    const inCollection = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ name: 'In collection', collectionId: collection.body.id })
    const standalone = await api().post('/api/v1/trackers').set(asOwner).send({ name: 'Standalone' })
    await prisma.tracker.update({ where: { id: standalone.body.id }, data: { openedAt: new Date() } })

    const names = async (query: string) =>
      (await api().get(`/api/v1/trackers${query}`).set(asOwner)).body.items.map(
        (t: { name: string }) => t.name,
      )

    expect(await names('')).toEqual(['Standalone', 'In collection']) // newest first
    expect(await names(`?collectionId=${collection.body.id}`)).toEqual(['In collection'])
    expect(await names('?collectionId=none')).toEqual(['Standalone'])
    expect(await names('?status=opened')).toEqual(['Standalone'])
    expect(await names('?status=not-opened')).toEqual(['In collection'])
    expect(inCollection.body.collection).toEqual({ id: collection.body.id, name: 'Razorpay' })
  })

  it('shows one tracker with its hits', async () => {
    const created = await api().post('/api/v1/trackers').set(asOwner).send({})
    await prisma.hit.create({
      data: { trackerId: created.body.id, outcome: 'COUNTED_AS_OPEN', userAgent: 'GoogleImageProxy' },
    })

    const res = await api().get(`/api/v1/trackers/${created.body.id}`).set(asOwner)
    expect(res.status).toBe(200)
    expect(res.body.hits).toHaveLength(1)
    expect(res.body.hits[0]).toMatchObject({ outcome: 'COUNTED_AS_OPEN' })
    // The recipient's IP and browser are only used by the tracking rules, never sent out
    expect(res.body.hits[0]).not.toHaveProperty('userAgent')
    expect(res.body.hits[0]).not.toHaveProperty('ipAddress')
  })

  it('moves a tracker into and out of a collection', async () => {
    const collection = await api().post('/api/v1/collections').set(asOwner).send({ name: 'Razorpay' })
    const tracker = await api().post('/api/v1/trackers').set(asOwner).send({})
    const url = `/api/v1/trackers/${tracker.body.id}`

    const moved = await api().patch(url).set(asOwner).send({ collectionId: collection.body.id, name: 'HR' })
    expect(moved.body).toMatchObject({ name: 'HR', collection: { id: collection.body.id } })

    const removed = await api().patch(url).set(asOwner).send({ collectionId: null })
    expect(removed.body.collection).toBeNull()
  })

  it('deletes a tracker and its hits', async () => {
    const tracker = await api().post('/api/v1/trackers').set(asOwner).send({})
    await prisma.hit.create({ data: { trackerId: tracker.body.id, outcome: 'ALREADY_OPENED' } })

    expect((await api().delete(`/api/v1/trackers/${tracker.body.id}`).set(asOwner)).status).toBe(204)
    expect(await prisma.hit.count()).toBe(0)
  })

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    expect((await api().get('/api/v1/trackers/short').set(asOwner)).status).toBe(400)
    expect((await api().get('/api/v1/trackers/AAAAAAAAAAAA').set(asOwner)).status).toBe(404)
  })

  it('never shows or changes another user’s trackers', async () => {
    const id = await createSomeoneElsesTracker()
    const url = `/api/v1/trackers/${id}`

    expect((await api().get(url).set(asOwner)).status).toBe(404)
    expect((await api().patch(url).set(asOwner).send({ name: 'x' })).status).toBe(404)
    expect((await api().delete(url).set(asOwner)).status).toBe(404)
    expect((await api().get('/api/v1/trackers').set(asOwner)).body.items).toEqual([])
    expect(await prisma.tracker.findUnique({ where: { id } })).toMatchObject({ name: 'Theirs' }) // untouched
  })
})
