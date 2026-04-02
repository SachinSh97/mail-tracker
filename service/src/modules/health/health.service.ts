import { prisma } from '../../database/prisma-client.js'

export type DependencyStatus = 'up' | 'down'

export interface HealthReport {
  status: 'ok' | 'degraded'
  uptimeSeconds: number
  database: DependencyStatus
}

// Give up on the database check after this long, so /health always answers quickly
const DATABASE_CHECK_TIMEOUT_MS = 3000

export async function getHealthReport(): Promise<HealthReport> {
  const database = await checkDatabase()

  return {
    status: database === 'up' ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    database,
  }
}

// Runs a tiny query. Besides checking the connection, this keeps Neon awake
// when the keep-alive pinger calls /health every few minutes.
async function checkDatabase(): Promise<DependencyStatus> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DATABASE_CHECK_TIMEOUT_MS)
    return 'up'
  } catch {
    return 'down'
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
