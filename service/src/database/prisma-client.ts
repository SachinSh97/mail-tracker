import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '../config/env.js'
import { PrismaClient } from '../generated/prisma/client.js'

// One PrismaClient for the whole service. It keeps a small pool of connections to Neon.
// Prisma 7 talks to Postgres through a "driver adapter"; here it's the standard `pg` driver.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
