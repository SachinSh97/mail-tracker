import { z } from 'zod'

// All environment variables the service needs, checked once at startup.
// If anything is missing or wrong, the service refuses to start and says exactly what to fix.
const envSchema = z
  .object({
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

    // Other websites allowed to call the API with the session cookie, comma-separated
    // (e.g. https://mail-tracker.onrender.com). Leave empty when the web app is served from the same site.
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean),
      ),

    // How many proxies sit in front of the service and add X-Forwarded-For (Render's own proxy = 1).
    // Wrong value: either everyone looks like the proxy's IP, or visitors can fake their IP.
    // That affects spotting your own opens and the rate limits.
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  })
  // Mistakes that would quietly weaken security in production: refuse to start instead
  .superRefine((env, ctx) => {
    // Render sets RENDER=true on its servers
    if (process.env.RENDER && env.NODE_ENV !== 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['NODE_ENV'],
        message: 'must be "production" on Render (otherwise the session cookie is not HTTPS-only)',
      })
    }
    if (env.NODE_ENV !== 'production') return

    if (!env.PUBLIC_BASE_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['PUBLIC_BASE_URL'],
        message: 'must start with https:// in production',
      })
    }
    for (const origin of env.CORS_ORIGINS) {
      if (!origin.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGINS'],
          message: `${origin} must start with https://`,
        })
      }
    }
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
export const isTest = env.NODE_ENV === 'test'
