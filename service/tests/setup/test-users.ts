// The users the tests act as. `resetDatabase()` (tests/helpers.ts) creates both before every test.

// The signed-in user. Fake Google accepts OWNER_GOOGLE_TOKEN as this person (see mock-google-sign-in.ts).
export const OWNER = {
  id: '00000000-0000-4000-8000-000000000001',
  googleId: 'google-sub-owner',
  email: 'owner@gmail.com',
  name: 'Owner Person',
}
export const OWNER_GOOGLE_TOKEN = 'valid-google-id-token-of-owner'

// Someone who has never signed in before. Fake Google accepts NEW_USER_GOOGLE_TOKEN as them.
export const NEW_USER = { googleId: 'google-sub-new', email: 'newcomer@gmail.com', name: 'New Person' }
export const NEW_USER_GOOGLE_TOKEN = 'valid-google-id-token-of-newcomer'

// Someone else. Their data is inserted straight into the database,
// to prove the owner never sees or changes it.
export const OTHER_USER = {
  id: '00000000-0000-4000-8000-000000000002',
  googleId: 'google-sub-other',
  email: 'someone-else@gmail.com',
  name: 'Someone Else',
}

// Must match SESSION_SECRET in vitest.config.ts
export const TEST_SESSION_SECRET = 'test-session-secret-0123456789abcdef0123456789'
