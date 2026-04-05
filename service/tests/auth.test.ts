import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/database/prisma-client.js'
import {
  api,
  asOwner,
  NEW_USER,
  NEW_USER_GOOGLE_TOKEN,
  OWNER,
  OWNER_GOOGLE_TOKEN,
  resetDatabase,
  TEST_SESSION_SECRET,
} from './helpers.js'

beforeEach(resetDatabase)

const signInWithGoogle = (body: unknown) =>
  api()
    .post('/api/v1/auth/google')
    .send(body as object)
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** A session token like ours, but with a chosen secret / user / expiry, to test that bad ones are refused */
const makeSessionToken = ({
  secret = TEST_SESSION_SECRET,
  userId = OWNER.id,
  expiresAt = '1h' as string | number,
}) =>
  new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('mail-tracker')
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret))

describe('Sign in with Google', () => {
  it('creates the user on their first sign-in', async () => {
    const res = await signInWithGoogle({ idToken: NEW_USER_GOOGLE_TOKEN })

    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ email: NEW_USER.email, name: NEW_USER.name })
    const saved = await prisma.user.findUniqueOrThrow({ where: { googleId: NEW_USER.googleId } })
    expect(saved.id).toBe(res.body.user.id)

    // Stays signed in for SESSION_TTL_DAYS (default 30)
    const daysValid = (Date.parse(res.body.expiresAt) - Date.now()) / 86_400_000
    expect(daysValid).toBeCloseTo(30, 0)
  })

  it('recognises a returning user by Google ID, and refreshes their email and name', async () => {
    await prisma.user.update({
      where: { id: OWNER.id },
      data: { email: 'old-address@gmail.com', name: 'Old Name', lastSignInAt: new Date(0) },
    })

    const res = await signInWithGoogle({ idToken: OWNER_GOOGLE_TOKEN })

    expect(res.body.user).toEqual({ id: OWNER.id, email: OWNER.email, name: OWNER.name }) // same user
    expect(await prisma.user.count()).toBe(2) // no duplicate created
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: OWNER.id } })
    expect(saved.lastSignInAt.getTime()).toBeGreaterThan(Date.now() - 60_000)
  })

  it('the session token works for the rest of the API', async () => {
    const { body } = await signInWithGoogle({ idToken: NEW_USER_GOOGLE_TOKEN })

    const me = await api().get('/api/v1/me').set(bearer(body.sessionToken))
    expect(me.status).toBe(200)
    expect(me.body).toEqual(body.user)
  })

  it('rejects a token Google did not issue for this app', async () => {
    const res = await signInWithGoogle({ idToken: 'fake-or-expired-google-token' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
    expect(await prisma.user.count()).toBe(2) // nobody created
  })

  it('requires an idToken', async () => {
    expect((await signInWithGoogle({})).status).toBe(400)
  })
})

describe('Protected routes', () => {
  it('reject requests without a token', async () => {
    const res = await api().get('/api/v1/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('reject a Google ID token used directly (only our session token is accepted)', async () => {
    expect((await api().get('/api/v1/me').set(bearer(OWNER_GOOGLE_TOKEN))).status).toBe(401)
  })

  it('reject a session token signed with a different secret', async () => {
    const forged = await makeSessionToken({ secret: 'a-different-secret-0123456789abcdef0123456789' })
    expect((await api().get('/api/v1/me').set(bearer(forged))).status).toBe(401)
  })

  it('reject an expired session token', async () => {
    const expired = await makeSessionToken({ expiresAt: Math.floor(Date.now() / 1000) - 60 })
    expect((await api().get('/api/v1/me').set(bearer(expired))).status).toBe(401)
  })

  it('reject a valid token whose user was deleted', async () => {
    await prisma.user.delete({ where: { id: OWNER.id } })
    expect((await api().get('/api/v1/me').set(asOwner)).status).toBe(401)
  })

  it('accept a valid session token', async () => {
    const res = await api().get('/api/v1/me').set(asOwner)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: OWNER.id, email: OWNER.email, name: OWNER.name })
  })

  it('keep /health public', async () => {
    const res = await api().get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' })
  })
})
