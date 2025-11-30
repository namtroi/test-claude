import {
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  DriftRequestSchema,
  DriftResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
  type DriftRequest,
  type DriftResponse,
  type ErrorResponse,
} from '@repo-viz/shared'

export class ApiError extends Error {
  statusCode?: number
  requestId?: string
  details?: unknown

  constructor(message: string, statusCode?: number, requestId?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.requestId = requestId
    this.details = details
  }
}

class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl: string, timeout = 30000) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async handleResponse<T>(response: Response, schema: unknown): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as ErrorResponse | null

      if (errorData) {
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          errorData.statusCode || response.status,
          errorData.requestId,
          errorData.details
        )
      }

      throw new ApiError(`HTTP ${response.status}`, response.status)
    }

    const data = await response.json()
    return (schema as { parse: (data: unknown) => T }).parse(data)
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    // Check network connection
    if (!navigator.onLine) {
      throw new ApiError('No network connection. Please check your internet and try again.')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timed out. The server took too long to respond.')
        }
        if (error.message.includes('Failed to fetch')) {
          throw new ApiError('Failed to connect to server. Please ensure the API is running.')
        }
      }
      throw error
    }
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    AnalyzeRequestSchema.parse(request)

    const response = await this.fetchWithTimeout(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    return this.handleResponse<AnalyzeResponse>(response, AnalyzeResponseSchema)
  }

  async drift(request: DriftRequest): Promise<DriftResponse> {
    DriftRequestSchema.parse(request)

    const response = await this.fetchWithTimeout(`${this.baseUrl}/drift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    return this.handleResponse<DriftResponse>(response, DriftResponseSchema)
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
)
