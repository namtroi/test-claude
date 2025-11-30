import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError } from './api-client'
import type { AnalyzeRequest } from '@repo-viz/shared'

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('analyze', () => {
    it('makes successful request', async () => {
      const mockResponse = {
        files: [],
        graph: [],
        mermaid: 'graph LR',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const request: AnalyzeRequest = {
        files: [
          { path: 'test.ts', content: 'export const x = 1', language: 'typescript' },
        ],
      }

      const result = await apiClient.analyze(request)
      expect(result).toEqual(mockResponse)
    })

    it('throws ApiError on failed request', async () => {
      const errorResponse = {
        error: 'ValidationError',
        message: 'Invalid input',
        statusCode: 422,
        requestId: 'req-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => errorResponse,
      })

      const request: AnalyzeRequest = {
        files: [
          { path: 'test.ts', content: 'export const x = 1', language: 'typescript' },
        ],
      }

      await expect(apiClient.analyze(request)).rejects.toThrow(ApiError)
    })

    it('throws ApiError on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      const request: AnalyzeRequest = {
        files: [
          { path: 'test.ts', content: 'export const x = 1', language: 'typescript' },
        ],
      }

      await expect(apiClient.analyze(request)).rejects.toThrow(ApiError)
    })
  })

  describe('ApiError', () => {
    it('creates error with all properties', () => {
      const error = new ApiError('Test error', 422, 'req-123', { field: 'path' })

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(422)
      expect(error.requestId).toBe('req-123')
      expect(error.details).toEqual({ field: 'path' })
      expect(error.name).toBe('ApiError')
    })
  })
})
