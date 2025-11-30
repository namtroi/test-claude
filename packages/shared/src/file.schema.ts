import { z } from 'zod';

/**
 * Supported programming languages
 */
export const LanguageSchema = z.enum(['typescript', 'javascript']);

/**
 * File input schema
 */
export const FileInputSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
  language: LanguageSchema,
});

/**
 * Export information schema
 */
export const ExportInfoSchema = z.object({
  name: z.string(),
  type: z.enum(['function', 'class', 'variable', 'type', 'interface']),
});

/**
 * Import information schema
 */
export const ImportInfoSchema = z.object({
  source: z.string(),
  specifiers: z.array(z.string()),
});

/**
 * Parsed file output schema
 */
export const ParsedFileSchema = z.object({
  path: z.string(),
  exports: z.array(ExportInfoSchema),
  imports: z.array(ImportInfoSchema),
});

// TypeScript types
export type Language = z.infer<typeof LanguageSchema>;
export type FileInput = z.infer<typeof FileInputSchema>;
export type ExportInfo = z.infer<typeof ExportInfoSchema>;
export type ImportInfo = z.infer<typeof ImportInfoSchema>;
export type ParsedFile = z.infer<typeof ParsedFileSchema>;
