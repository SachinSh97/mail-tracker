import { pino } from 'pino'
import { env, isProduction } from '../config/env.js'

// One shared logger for the whole service.
// Production: plain JSON lines (what Render's log viewer expects).
// Development: colored, human-readable lines.
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,req,res,responseTime' },
        },
      }),
})
