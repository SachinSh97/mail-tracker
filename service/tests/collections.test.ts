import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/database/prisma-client.js'
import { api, asOwner, createSomeoneElsesCollection, resetDatabase } from './helpers.js'

beforeEach(resetDatabase)

async function createCollection(name = 'Razorpay – Senior Frontend') {
  const res = await api().post('/api/v1/collections').set(asOwner).send({ name })
  return res.body as { id: string }
}

describe('Collections', () => {
  it('creates a collection', async () => {
    const res = await api()
      .post('/api/v1/collections')
      .set(asOwner)
      .send({ name: '  Razorpay  ', description: 'Applied via careers page' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: 'Razorpay', // trimmed
      description: 'Applied via careers page',
      trackerCount: 0,
      openedCount: 0,
    })
  })

  it('requires a name', async () => {
    const res = await api().post('/api/v1/collections').set(asOwner).send({ name: '   ' })
    expect(res.status).toBe(400)
  })

  it('lists collections newest first, with pagination and tracker counts', async () => {
    const first = await createCollection('First')
    await createCollection('Second')
    await api().post('/api/v1/trackers').set(asOwner).send({ name: 'A', collectionId: first.id })
    const opened = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ name: 'B', collectionId: first.id })
    await prisma.tracker.update({ where: { id: opened.body.id }, data: { openedAt: new Date() } })

    const res = await api().get('/api/v1/collections?limit=1&offset=1').set(asOwner)

    expect(res.status).toBe(200)
    expect(res.body.pagination).toEqual({ limit: 1, offset: 1, total: 2 })
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({ name: 'First', trackerCount: 2, openedCount: 1 })
  })

  it('updates a collection', async () => {
    const { id } = await createCollection()
    const res = await api().patch(`/api/v1/collections/${id}`).set(asOwner).send({ name: 'Renamed' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Renamed')
  })

  it('deleting a collection keeps its trackers as standalone trackers', async () => {
    const { id } = await createCollection()
    const tracker = await api().post('/api/v1/trackers').set(asOwner).send({ name: 'HR', collectionId: id })

    expect((await api().delete(`/api/v1/collections/${id}`).set(asOwner)).status).toBe(204)
    expect((await api().get(`/api/v1/collections/${id}`).set(asOwner)).status).toBe(404)

    const stillThere = await api().get(`/api/v1/trackers/${tracker.body.id}`).set(asOwner)
    expect(stillThere.status).toBe(200)
    expect(stillThere.body.collection).toBeNull()
  })

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    expect((await api().get('/api/v1/collections/not-a-uuid').set(asOwner)).status).toBe(400)
    const unknown = '00000000-0000-4000-8000-000000000000'
    expect((await api().get(`/api/v1/collections/${unknown}`).set(asOwner)).status).toBe(404)
  })

  it('never shows or changes another user’s collections', async () => {
    const id = await createSomeoneElsesCollection()
    const url = `/api/v1/collections/${id}`

    expect((await api().get(url).set(asOwner)).status).toBe(404)
    expect((await api().patch(url).set(asOwner).send({ name: 'x' })).status).toBe(404)
    expect((await api().delete(url).set(asOwner)).status).toBe(404)
    expect((await api().get('/api/v1/collections').set(asOwner)).body.items).toEqual([])
    expect(await prisma.collection.findUnique({ where: { id } })).toMatchObject({ name: 'Theirs' }) // untouched
  })
})
