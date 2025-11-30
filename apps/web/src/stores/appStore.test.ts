import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'
import type { AnalyzeResponse, DriftResponse } from '@repo-viz/shared'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentAnalysis: null,
      previousSnapshot: null,
      driftResult: null,
    })
  })

  const mockAnalysis: AnalyzeResponse = {
    files: [],
    graph: [],
    mermaid: 'graph LR',
  }

  const mockDrift: DriftResponse = {
    added: ['a.ts'],
    removed: ['b.ts'],
    modified: ['c.ts'],
    changes: [],
  }

  it('sets analysis', () => {
    const { setAnalysis } = useAppStore.getState()
    setAnalysis(mockAnalysis)
    expect(useAppStore.getState().currentAnalysis).toEqual(mockAnalysis)
  })

  it('sets previous snapshot', () => {
    const { setPreviousSnapshot } = useAppStore.getState()
    setPreviousSnapshot(mockAnalysis)
    expect(useAppStore.getState().previousSnapshot).toEqual(mockAnalysis)
  })

  it('sets drift result', () => {
    const { setDrift } = useAppStore.getState()
    setDrift(mockDrift)
    expect(useAppStore.getState().driftResult).toEqual(mockDrift)
  })

  it('clears analysis', () => {
    const { setAnalysis, clearAnalysis } = useAppStore.getState()
    setAnalysis(mockAnalysis)
    clearAnalysis()

    const state = useAppStore.getState()
    expect(state.currentAnalysis).toBeNull()
    expect(state.previousSnapshot).toBeNull()
    expect(state.driftResult).toBeNull()
  })
})
