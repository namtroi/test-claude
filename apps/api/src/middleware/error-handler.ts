import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;

  logger.error('Request error', {
    method: request.method,
    url: request.url,
    requestId,
    error: error.message,
    stack: error.stack,
  });

  if (error instanceof ZodError) {
    // Format Zod errors for better readability
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return sendError(
      reply,
      'ValidationError',
      'Request validation failed. Please check the provided data.',
      422,
      formattedErrors,
      requestId
    );
  }

  if (error instanceof AppError) {
    return sendError(
      reply,
      error.name,
      error.message,
      error.statusCode,
      error.details,
      requestId
    );
  }

  return sendError(
    reply,
    'InternalServerError',
    'An unexpected error occurred. Please try again later.',
    500,
    undefined,
    requestId
  );
}
