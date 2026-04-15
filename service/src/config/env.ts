import { z } from 'zod'

// All environment variables the service needs, checked once at startup.
// If anything is missing or wrong, the service refuses to start and says exactly what to fix.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.url({ message: 'must be a Postgres connection string from Neon' }),

  // Where tracker links point to; trailing slash removed so we can safely append paths
  PUBLIC_BASE_URL: z
    .url({ message: 'must be a full URL like https://my-app.onrender.com' })
    .transform((url) => url.replace(/\/+$/, '')),

  // Hits this soon after a tracker is created are ignored (e.g. your own draft loading the pixel)
  TRACKING_GRACE_PERIOD_SECONDS: z.coerce.number().int().min(0).max(3600).default(60),

  // --- Auth: "Sign in with Google" ---
  // Client ID from Google Cloud Console → Google Auth Platform → Clients. Not a secret.
  GOOGLE_CLIENT_ID: z
    .string({ message: 'is required (Google Cloud Console → Google Auth Platform → Clients)' })
    .endsWith('.apps.googleusercontent.com', { message: 'must end with .apps.googleusercontent.com' }),
  // Signs our own session tokens. Keep it secret; changing it signs everyone out.
  SESSION_SECRET: z
    .string({ message: 'is required, generate one (see .env.example)' })
    .min(32, { message: 'must be at least 32 characters' }),
  // How many days you stay signed in
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
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
