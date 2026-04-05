import { execSync } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'
import { TEST_DATABASE_NAME, TEST_DATABASE_PORT, TEST_DATABASE_URL } from './test-database.js'

// Runs once before all tests:
//   1. starts a real Postgres from node_modules (no Docker, nothing installed on your machine)
//   2. applies our Prisma migrations to it
// The returned function runs once after all tests and deletes everything.
export default async function setup() {
  const databaseDir = await mkdtemp(join(tmpdir(), 'mail-tracker-test-db-'))

  const postgres = new EmbeddedPostgres({
    databaseDir,
    port: TEST_DATABASE_PORT,
    user: 'postgres',
    password: 'postgres',
    persistent: false, // delete the data folder when stopped
    onLog: () => {}, // keep test output clean
  })

  await postgres.initialise()
  await postgres.start()
  await postgres.createDatabase(TEST_DATABASE_NAME)

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'ignore',
  })

  return async () => {
    await postgres.stop()
  }
}
