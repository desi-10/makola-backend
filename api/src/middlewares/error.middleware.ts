import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error.js";
import { logError } from "../utils/pino-logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "Internal server error";

  // logError(err, {
  //   method: req.method,
  //   path: req.originalUrl,
  //   statusCode,
  //   isOperational: isApiError && err.isOperational,
  // });

  // if (statusCode >= 500) {
  //   req.log.error({ err, statusCode }, message); // 💥 logs with request context automatically
  // } else {
  //   req.log.warn({ err, statusCode }, message); // 💥 logs with request context automatically
  // }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isApiError && err.details && { details: err.details }),
  });
}
