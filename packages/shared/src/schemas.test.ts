import { describe, it, expect } from 'vitest'
import {
  FileInputSchema,
  AnalyzeRequestSchema,
  DriftRequestSchema,
  ErrorResponseSchema,
} from './index.js'

describe('Schema Validation', () => {
  describe('FileInputSchema', () => {
    it('validates correct file input', () => {
      const validFile = {
        path: 'src/test.ts',
        content: 'export const x = 1',
        language: 'typescript',
      }

      expect(() => FileInputSchema.parse(validFile)).not.toThrow()
    })

    it('rejects invalid language', () => {
      const invalidFile = {
        path: 'test.py',
        content: 'print("hello")',
        language: 'python',
      }

      expect(() => FileInputSchema.parse(invalidFile)).toThrow()
    })

    it('rejects missing fields', () => {
      const invalidFile = {
        path: 'test.ts',
      }

      expect(() => FileInputSchema.parse(invalidFile)).toThrow()
    })
  })

  describe('AnalyzeRequestSchema', () => {
    it('validates correct analyze request', () => {
      const validRequest = {
        files: [
          {
            path: 'a.ts',
            content: 'export const a = 1',
            language: 'typescript',
          },
        ],
      }

      expect(() => AnalyzeRequestSchema.parse(validRequest)).not.toThrow()
    })

    it('rejects empty files array', () => {
      const invalidRequest = {
        files: [],
      }

      expect(() => AnalyzeRequestSchema.parse(invalidRequest)).toThrow()
    })
  })

  describe('DriftRequestSchema', () => {
    const mockAnalysis = {
      files: [],
      graph: [],
      nodes: [],
      mermaid: '',
    }

    it('validates correct drift request', () => {
      const validRequest = {
        current: mockAnalysis,
        previous: mockAnalysis,
      }

      expect(() => DriftRequestSchema.parse(validRequest)).not.toThrow()
    })

    it('rejects missing fields', () => {
      const invalidRequest = {
        current: mockAnalysis,
      }

      expect(() => DriftRequestSchema.parse(invalidRequest)).toThrow()
    })
  })

  describe('ErrorResponseSchema', () => {
    it('validates error response', () => {
      const validError = {
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: 422,
      }

      expect(() => ErrorResponseSchema.parse(validError)).not.toThrow()
    })

    it('validates error with optional fields', () => {
      const validError = {
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: 422,
        requestId: 'req-123',
        details: { field: 'path', issue: 'required' },
      }

      expect(() => ErrorResponseSchema.parse(validError)).not.toThrow()
    })
  })
})
