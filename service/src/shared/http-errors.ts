// Errors that map directly to an HTTP response.
// Throw one anywhere in a request and the error handler turns it into JSON:
//   { "error": { "code": "NOT_FOUND", "message": "Tracker not found" } }

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Please sign in') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Not allowed') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message)
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message = 'Request body is too large') {
    super(413, 'PAYLOAD_TOO_LARGE', message)
  }
}
