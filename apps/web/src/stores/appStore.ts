import { create } from 'zustand'
import type { AnalyzeResponse, DriftResponse } from '@repo-viz/shared'

interface AppState {
  currentAnalysis: AnalyzeResponse | null
  previousSnapshot: AnalyzeResponse | null
  driftResult: DriftResponse | null
  setAnalysis: (analysis: AnalyzeResponse) => void
  setPreviousSnapshot: (snapshot: AnalyzeResponse) => void
  setDrift: (drift: DriftResponse) => void
  clearAnalysis: () => void
  exportSnapshot: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentAnalysis: null,
  previousSnapshot: null,
  driftResult: null,

  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  setPreviousSnapshot: (snapshot) => set({ previousSnapshot: snapshot }),

  setDrift: (drift) => set({ driftResult: drift }),

  clearAnalysis: () =>
    set({
      currentAnalysis: null,
      previousSnapshot: null,
      driftResult: null,
    }),

  exportSnapshot: () => {
    const { currentAnalysis } = get()
    if (!currentAnalysis) return

    const blob = new Blob([JSON.stringify(currentAnalysis, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapshot-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
