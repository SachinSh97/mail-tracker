import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from '../shared/http-errors.js'

// Runs when no route matched. Passes a 404 to the error handler so all errors look the same.
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path} does not exist`))
}
