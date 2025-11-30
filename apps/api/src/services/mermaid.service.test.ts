import { describe, it, expect } from 'vitest'
import { MermaidService } from './mermaid.service.js'
import type { DependencyNode } from '@repo-viz/shared'

describe('MermaidService', () => {
  const service = new MermaidService()

  describe('generateMermaid', () => {
    it('generates mermaid syntax for simple graph', () => {
      const graph: DependencyNode[] = [
        { path: 'src/a.ts', dependencies: ['src/b.ts'] },
        { path: 'src/b.ts', dependencies: [] },
      ]

      const result = service.generateMermaid(graph)

      expect(result).toContain('graph LR')
      expect(result).toContain('N0["a.ts"]')
      expect(result).toContain('N1["b.ts"]')
      expect(result).toContain('N0 --> N1')
    })

    it('handles nodes with no dependencies', () => {
      const graph: DependencyNode[] = [
        { path: 'standalone.ts', dependencies: [] },
      ]

      const result = service.generateMermaid(graph)

      expect(result).toContain('graph LR')
      expect(result).toContain('N0["standalone.ts"]')
      expect(result).not.toContain('-->')
    })

    it('handles empty graph', () => {
      const result = service.generateMermaid([])

      expect(result).toContain('graph LR')
      expect(result).toContain('empty["No files analyzed"]')
    })

    it('handles multiple dependencies', () => {
      const graph: DependencyNode[] = [
        { path: 'a.ts', dependencies: ['b.ts', 'c.ts'] },
        { path: 'b.ts', dependencies: [] },
        { path: 'c.ts', dependencies: [] },
      ]

      const result = service.generateMermaid(graph)

      expect(result).toContain('N0 --> N1')
      expect(result).toContain('N0 --> N2')
    })

    it('extracts filename from path', () => {
      const graph: DependencyNode[] = [
        { path: 'src/deep/nested/file.ts', dependencies: [] },
      ]

      const result = service.generateMermaid(graph)

      expect(result).toContain('N0["file.ts"]')
    })

    it('handles circular dependencies', () => {
      const graph: DependencyNode[] = [
        { path: 'a.ts', dependencies: ['b.ts'] },
        { path: 'b.ts', dependencies: ['a.ts'] },
      ]

      const result = service.generateMermaid(graph)

      expect(result).toContain('N0 --> N1')
      expect(result).toContain('N1 --> N0')
    })
  })
})
