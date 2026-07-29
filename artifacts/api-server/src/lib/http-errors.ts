import type { Response } from "express";

export function sendError(
  response: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return response.status(status).json({
    error: message,
    code,
    ...(details === undefined ? {} : { details }),
  });
}
