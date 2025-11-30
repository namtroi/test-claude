import { z } from 'zod';

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  requestId: z.string().optional(),
  details: z.unknown().optional(),
});

// TypeScript type
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
