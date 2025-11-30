import { z } from 'zod';
import { FileInputSchema, ParsedFileSchema } from './file.schema.js';

/**
 * Analyze request schema
 */
export const AnalyzeRequestSchema = z.object({
  files: z.array(FileInputSchema).min(1, 'At least one file is required'),
});

/**
 * Dependency graph node schema
 */
export const DependencyNodeSchema = z.object({
  id: z.string(),
  path: z.string(),
  dependencies: z.array(z.string()),
});

/**
 * Analyze response schema
 */
export const AnalyzeResponseSchema = z.object({
  files: z.array(ParsedFileSchema),
  graph: z.array(DependencyNodeSchema),
  mermaid: z.string(),
});

// TypeScript types
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type DependencyNode = z.infer<typeof DependencyNodeSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
