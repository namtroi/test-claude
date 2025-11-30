import { useCallback } from 'react'
import { apiClient, ApiError } from '@/utils/api-client'
import { useAppStore } from '@/stores/appStore'
import { useUiStore } from '@/stores/uiStore'
import type { DriftRequest } from '@repo-viz/shared'

export const useDrift = () => {
  const setDrift = useAppStore((state) => state.setDrift)
  const { setLoading, setError, addToast } = useUiStore()

  const detectDrift = useCallback(
    async (request: DriftRequest) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.drift(request)
        setDrift(result)
        addToast('Drift detection completed', 'success')
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Drift detection failed'
        setError(message)
        addToast(message, 'error')

        if (error instanceof ApiError) {
          throw error
        }
        throw error
      } finally {
        setLoading(false)
      }
    },
    [setDrift, setLoading, setError, addToast]
  )

  return { detectDrift }
}
