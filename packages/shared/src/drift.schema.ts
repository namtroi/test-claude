import { z } from 'zod';
import { AnalyzeResponseSchema } from './analyze.schema.js';

/**
 * Drift request schema
 */
export const DriftRequestSchema = z.object({
  current: AnalyzeResponseSchema,
  previous: AnalyzeResponseSchema,
});

/**
 * File change details schema
 */
export const FileChangeSchema = z.object({
  path: z.string(),
  changeType: z.enum(['added', 'removed', 'modified']),
  before: z.object({
    dependencies: z.array(z.string()),
  }).optional(),
  after: z.object({
    dependencies: z.array(z.string()),
  }).optional(),
});

/**
 * Drift response schema
 */
export const DriftResponseSchema = z.object({
  added: z.array(z.string()),
  removed: z.array(z.string()),
  modified: z.array(z.string()),
  changes: z.array(FileChangeSchema),
});

// TypeScript types
export type DriftRequest = z.infer<typeof DriftRequestSchema>;
export type FileChange = z.infer<typeof FileChangeSchema>;
export type DriftResponse = z.infer<typeof DriftResponseSchema>;
