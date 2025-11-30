import type { FastifyReply } from 'fastify';
import type { ErrorResponse } from '@repo-viz/shared';

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.code(statusCode).send(data);
}

export function sendError(
  reply: FastifyReply,
  error: string,
  message: string,
  statusCode = 500,
  details?: unknown,
  requestId?: string
) {
  const response: ErrorResponse = {
    error,
    message,
    statusCode,
    requestId,
    details,
  };

  return reply.code(statusCode).send(response);
}
