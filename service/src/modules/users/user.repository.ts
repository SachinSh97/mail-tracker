import { prisma } from '../../database/prisma-client.js'

const userFields = { id: true, email: true, name: true } as const

export interface GoogleAccount {
  googleId: string
  email: string
  name: string | null
}

/**
 * Called on every Google sign-in. Finds the user by their Google ID (which never changes)
 * or creates them on their first sign-in. Email and name are refreshed, since they can change in Google.
 */
export function upsertGoogleUser(account: GoogleAccount) {
  const now = new Date()
  return prisma.user.upsert({
    where: { googleId: account.googleId },
    create: { ...account, lastSignInAt: now },
    update: { email: account.email, name: account.name, lastSignInAt: now },
    select: userFields,
  })
}

export function findUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: userFields })
}
