import { describe, it, expect } from 'vitest'
import { DriftService } from './drift.service.js'
import type { AnalyzeResponse } from '@repo-viz/shared'

describe('DriftService', () => {
  const service = new DriftService()

  const createMockAnalysis = (files: Array<{ path: string; deps: string[] }>): AnalyzeResponse => ({
    files: files.map((f) => ({
      path: f.path,
      exports: [],
      imports: f.deps.map((d) => ({ source: d, specifiers: [] })),
    })),
    graph: files.map((f) => ({ id: f.path, path: f.path, dependencies: f.deps })),
    mermaid: '',
  })

  describe('detectDrift', () => {
    it('detects added files', () => {
      const previous = createMockAnalysis([{ path: 'a.ts', deps: [] }])
      const current = createMockAnalysis([
        { path: 'a.ts', deps: [] },
        { path: 'b.ts', deps: [] },
      ])

      const result = service.detectDrift(current, previous)

      expect(result.added).toEqual(['b.ts'])
      expect(result.removed).toEqual([])
      expect(result.modified).toEqual([])
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('added')
    })

    it('detects removed files', () => {
      const previous = createMockAnalysis([
        { path: 'a.ts', deps: [] },
        { path: 'b.ts', deps: [] },
      ])
      const current = createMockAnalysis([{ path: 'a.ts', deps: [] }])

      const result = service.detectDrift(current, previous)

      expect(result.added).toEqual([])
      expect(result.removed).toEqual(['b.ts'])
      expect(result.modified).toEqual([])
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('removed')
    })

    it('detects modified dependencies', () => {
      const previous = createMockAnalysis([{ path: 'a.ts', deps: ['b.ts'] }])
      const current = createMockAnalysis([{ path: 'a.ts', deps: ['b.ts', 'c.ts'] }])

      const result = service.detectDrift(current, previous)

      expect(result.added).toEqual([])
      expect(result.removed).toEqual([])
      expect(result.modified).toEqual(['a.ts'])
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].changeType).toBe('modified')
      expect(result.changes[0].before?.dependencies).toEqual(['b.ts'])
      expect(result.changes[0].after?.dependencies).toEqual(['b.ts', 'c.ts'])
    })

    it('handles no changes', () => {
      const analysis = createMockAnalysis([
        { path: 'a.ts', deps: ['b.ts'] },
        { path: 'b.ts', deps: [] },
      ])

      const result = service.detectDrift(analysis, analysis)

      expect(result.added).toEqual([])
      expect(result.removed).toEqual([])
      expect(result.modified).toEqual([])
      expect(result.changes).toEqual([])
    })

    it('handles complex drift scenario', () => {
      const previous = createMockAnalysis([
        { path: 'a.ts', deps: ['b.ts'] },
        { path: 'b.ts', deps: [] },
        { path: 'c.ts', deps: ['a.ts'] },
      ])

      const current = createMockAnalysis([
        { path: 'a.ts', deps: ['b.ts', 'd.ts'] }, // modified
        { path: 'b.ts', deps: [] }, // unchanged
        { path: 'd.ts', deps: [] }, // added
        // c.ts removed
      ])

      const result = service.detectDrift(current, previous)

      expect(result.added).toEqual(['d.ts'])
      expect(result.removed).toEqual(['c.ts'])
      expect(result.modified).toEqual(['a.ts'])
      expect(result.changes).toHaveLength(3)
    })
  })
})
