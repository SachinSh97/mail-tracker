import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../shared/http-errors.js'

interface ErrorResponseBody {
  error: { code: string; message: string; details?: unknown }
}

// Last middleware in the chain: turns any thrown error into a consistent JSON response.
// Express 5 forwards errors from async route handlers here automatically.
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Our own errors (NotFoundError, BadRequestError, ...)
  if (error instanceof HttpError) {
    sendError(res, error.statusCode, {
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  // Request body/query failed Zod validation
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    sendError(res, 400, { error: { code: 'VALIDATION_FAILED', message: 'Request is invalid', details } })
    return
  }

  // Malformed JSON body (thrown by express.json())
  if (bodyParserErrorType(error) === 'entity.parse.failed') {
    sendError(res, 400, { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } })
    return
  }

  // Body bigger than allowed (JSON bodies are limited to 100 KB)
  if (bodyParserErrorType(error) === 'entity.too.large') {
    sendError(res, 413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } })
    return
  }

  // Anything else is a bug: log the details, but never leak them to the caller
  req.log.error({ err: error }, 'Unhandled error')
  sendError(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
}

function sendError(res: Response, statusCode: number, body: ErrorResponseBody): void {
  // If a response already started (e.g. an SSE stream), we can't send JSON anymore
  if (res.headersSent) {
    res.end()
    return
  }
  res.status(statusCode).json(body)
}

// Express's body parsers tag their errors with a `type`, e.g. "entity.parse.failed"
function bodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'type' in error && typeof error.type === 'string') {
    return error.type
  }
  return undefined
}
