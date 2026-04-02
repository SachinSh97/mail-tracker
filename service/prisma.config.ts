import { existsSync } from 'node:fs'
import { defineConfig, env } from 'prisma/config'

// The Prisma CLI does not read .env by itself, so load it here (built into Node, no dotenv needed).
// On Render there is no .env file; variables come from the dashboard instead.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
