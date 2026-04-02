import type { Request, Response } from 'express'
import { getHealthReport } from './health.service.js'

// GET /health
// 200 when everything works, 503 when the database is unreachable,
// so uptime monitors can tell the difference.
export async function getHealth(_req: Request, res: Response): Promise<void> {
  const report = await getHealthReport()
  const statusCode = report.status === 'ok' ? 200 : 503

  res.status(statusCode).set('Cache-Control', 'no-store').json(report)
}
