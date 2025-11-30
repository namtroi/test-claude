import { useCallback } from 'react'
import { apiClient, ApiError } from '@/utils/api-client'
import { useAppStore } from '@/stores/appStore'
import { useUiStore } from '@/stores/uiStore'
import type { AnalyzeRequest } from '@repo-viz/shared'

export const useAnalyze = () => {
  const setAnalysis = useAppStore((state) => state.setAnalysis)
  const { setLoading, setError, addToast } = useUiStore()

  const analyze = useCallback(
    async (request: AnalyzeRequest) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.analyze(request)
        setAnalysis(result)
        addToast('Analysis completed successfully', 'success')
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Analysis failed'
        setError(message)
        addToast(message, 'error')

        // Return detailed error for modal
        if (error instanceof ApiError) {
          throw error
        }
        throw error
      } finally {
        setLoading(false)
      }
    },
    [setAnalysis, setLoading, setError, addToast]
  )

  return { analyze }
}
