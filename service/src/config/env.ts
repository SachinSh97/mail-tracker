import { z } from 'zod'

// All environment variables the service needs, checked once at startup.
// If anything is missing or wrong, the service refuses to start and says exactly what to fix.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.url({ message: 'must be a Postgres connection string from Neon' }),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    console.error(
      `❌ Invalid environment variables:\n${problems.join('\n')}\n\nCheck your .env file (see .env.example).`,
    )
    process.exit(1)
  }

  return result.data
}

export const env = loadEnv()

export const isProduction = env.NODE_ENV === 'production'
