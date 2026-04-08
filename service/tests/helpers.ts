import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/database/prisma-client.js'
import { createSessionToken } from '../src/modules/auth/session-token.js'
import { OTHER_USER, OWNER } from './setup/test-users.js'

export * from './setup/test-users.js'

const app = createApp()

/** Send a request to the app, e.g. `api().get('/health')` */
export const api = () => request(app)

/** Auth header of the signed-in user (a real session token): `.set(asOwner)` */
const ownerSession = await createSessionToken(OWNER.id)
export const asOwner = { Authorization: `Bearer ${ownerSession.token}` }

/** Empty every table, then add the two test users, so each test starts from the same state. */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE hits, trackers, collections, users CASCADE`
  await prisma.user.createMany({ data: [OWNER, OTHER_USER] })
}

/** A collection that belongs to another user. Returns its id. */
export async function createSomeoneElsesCollection(): Promise<string> {
  const collection = await prisma.collection.create({ data: { userId: OTHER_USER.id, name: 'Theirs' } })
  return collection.id
}
