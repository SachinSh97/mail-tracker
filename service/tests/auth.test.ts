import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/database/prisma-client.js'
import { SESSION_COOKIE } from '../src/modules/auth/session-cookie.js'
import {
  api,
  asOwner,
  NEW_USER,
  NEW_USER_GOOGLE_TOKEN,
  OWNER,
  OWNER_GOOGLE_TOKEN,
  resetDatabase,
  TEST_SESSION_SECRET,
  withSessionCookie,
} from './helpers.js'

beforeEach(resetDatabase)

const signInWithGoogle = (body: unknown) =>
  api()
    .post('/api/v1/auth/google')
    .send(body as object)

/** The session cookie from a response's Set-Cookie header, e.g. "mail_tracker_session=…; Path=/; HttpOnly" */
function sessionCookieFrom(res: { headers: Record<string, unknown> }): string | undefined {
  const cookies = (res.headers['set-cookie'] ?? []) as string[]
  return cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
}

/** Just the token inside a Set-Cookie value */
const tokenFrom = (setCookie: string) => setCookie.split(';')[0]!.slice(SESSION_COOKIE.length + 1)

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

  it('puts the session in an HttpOnly cookie, never in the response body', async () => {
    const res = await signInWithGoogle({ idToken: NEW_USER_GOOGLE_TOKEN })
    const cookie = sessionCookieFrom(res)

    expect(cookie).toBeDefined()
    expect(cookie).toContain('HttpOnly') // page scripts can't read it
    expect(cookie).toContain('SameSite=Lax') // other sites can't send it with their POST requests
    expect(cookie).toContain('Path=/')
    expect(cookie).toMatch(/Expires=/) // survives closing the browser, until the session ends
    expect(JSON.stringify(res.body)).not.toContain(tokenFrom(cookie!))
    expect(Object.keys(res.body).sort()).toEqual(['expiresAt', 'user'])
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

  it('the session cookie works for the rest of the API', async () => {
    const res = await signInWithGoogle({ idToken: NEW_USER_GOOGLE_TOKEN })
    const token = tokenFrom(sessionCookieFrom(res)!)

    const me = await api().get('/api/v1/me').set(withSessionCookie(token))
    expect(me.status).toBe(200)
    expect(me.body).toEqual(res.body.user)
  })

  it('rejects a token Google did not issue for this app, without setting a cookie', async () => {
    const res = await signInWithGoogle({ idToken: 'fake-or-expired-google-token' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
    expect(sessionCookieFrom(res)).toBeUndefined()
    expect(await prisma.user.count()).toBe(2) // nobody created
  })

  it('requires an idToken', async () => {
    expect((await signInWithGoogle({})).status).toBe(400)
  })
})

describe('Sign out', () => {
  it('deletes the session cookie, even without being signed in', async () => {
    const res = await api().post('/api/v1/auth/logout')

    expect(res.status).toBe(204)
    const cookie = sessionCookieFrom(res)
    expect(cookie).toContain(`${SESSION_COOKIE}=;`)
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970') // a date in the past makes the browser delete it
  })
})

describe('Protected routes', () => {
  it('reject requests without the session cookie', async () => {
    const res = await api().get('/api/v1/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('ignore an Authorization header (the session only travels in the cookie)', async () => {
    const token = await makeSessionToken({})
    expect(
      (
        await api()
          .get('/api/v1/me')
          .set({ Authorization: `Bearer ${token}` })
      ).status,
    ).toBe(401)
  })

  it('reject a Google ID token in place of our session', async () => {
    expect((await api().get('/api/v1/me').set(withSessionCookie(OWNER_GOOGLE_TOKEN))).status).toBe(401)
  })

  it('reject a session token signed with a different secret', async () => {
    const forged = await makeSessionToken({ secret: 'a-different-secret-0123456789abcdef0123456789' })
    expect((await api().get('/api/v1/me').set(withSessionCookie(forged))).status).toBe(401)
  })

  it('reject an expired session token', async () => {
    const expired = await makeSessionToken({ expiresAt: Math.floor(Date.now() / 1000) - 60 })
    expect((await api().get('/api/v1/me').set(withSessionCookie(expired))).status).toBe(401)
  })

  it('reject a valid token whose user was deleted', async () => {
    await prisma.user.delete({ where: { id: OWNER.id } })
    expect((await api().get('/api/v1/me').set(asOwner)).status).toBe(401)
  })

  it('accept a valid session cookie', async () => {
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

describe('Other websites', () => {
  it('are not allowed to call the API with the user’s cookie (CORS)', async () => {
    const preflight = await api()
      .options('/api/v1/collections')
      .set({ Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' })
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined()

    const read = await api()
      .get('/api/v1/me')
      .set({ ...asOwner, Origin: 'https://evil.example' })
    expect(read.headers['access-control-allow-origin']).toBeUndefined() // the browser hides the response
  })
})

describe('Deleting a user', () => {
  it('deletes all their collections, trackers and hits', async () => {
    const collection = await api().post('/api/v1/collections').set(asOwner).send({ name: 'Razorpay' })
    const tracker = await api()
      .post('/api/v1/trackers')
      .set(asOwner)
      .send({ collectionId: collection.body.id })
    await prisma.hit.create({ data: { trackerId: tracker.body.id, outcome: 'IGNORED_BOT' } })

    await prisma.user.delete({ where: { id: OWNER.id } })

    expect(await prisma.collection.count()).toBe(0)
    expect(await prisma.tracker.count()).toBe(0)
    expect(await prisma.hit.count()).toBe(0)
  })
})
