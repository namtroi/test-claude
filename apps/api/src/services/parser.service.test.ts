import { describe, it, expect } from 'vitest'
import { ParserService } from './parser.service.js'
import type { FileInput } from '@repo-viz/shared'

describe('ParserService', () => {
  const parser = new ParserService()

  describe('parseFile', () => {
    it('extracts function exports', () => {
      const file: FileInput = {
        path: 'test.ts',
        content: 'export function hello() { return "world" }',
        language: 'typescript',
      }

      const result = parser.parseFile(file)

      expect(result.path).toBe('test.ts')
      expect(result.exports).toHaveLength(1)
      expect(result.exports[0]).toEqual({ name: 'hello', type: 'function' })
    })

    it('extracts class exports', () => {
      const file: FileInput = {
        path: 'test.ts',
        content: 'export class MyClass {}',
        language: 'typescript',
      }

      const result = parser.parseFile(file)

      expect(result.exports).toHaveLength(1)
      expect(result.exports[0]).toEqual({ name: 'MyClass', type: 'class' })
    })

    it('extracts variable exports', () => {
      const file: FileInput = {
        path: 'test.ts',
        content: 'export const myVar = 42',
        language: 'typescript',
      }

      const result = parser.parseFile(file)

      expect(result.exports).toHaveLength(1)
      expect(result.exports[0]).toEqual({ name: 'myVar', type: 'variable' })
    })

    it('extracts imports', () => {
      const file: FileInput = {
        path: 'test.ts',
        content: 'import { foo, bar } from "./module"',
        language: 'typescript',
      }

      const result = parser.parseFile(file)

      expect(result.imports).toHaveLength(1)
      expect(result.imports[0]).toEqual({
        source: './module',
        specifiers: ['foo', 'bar'],
      })
    })

    it('handles multiple exports and imports', () => {
      const file: FileInput = {
        path: 'test.ts',
        content: `
          import { dep1 } from './dep1'
          import { dep2 } from './dep2'

          export function fn1() {}
          export const var1 = 1
          export class Class1 {}
        `,
        language: 'typescript',
      }

      const result = parser.parseFile(file)

      expect(result.exports).toHaveLength(3)
      expect(result.imports).toHaveLength(2)
    })
  })

  describe('parseProject', () => {
    it('builds dependency graph from multiple files', () => {
      const files: FileInput[] = [
        {
          path: 'a.ts',
          content: 'import { foo } from "./b"\nexport const a = 1',
          language: 'typescript',
        },
        {
          path: 'b.ts',
          content: 'export const foo = 2',
          language: 'typescript',
        },
      ]

      const result = parser.parseProject(files)

      expect(result.files).toHaveLength(2)
      expect(result.nodes).toHaveLength(2)

      const nodeA = result.nodes.find((n) => n.id === 'a.ts')
      expect(nodeA).toBeDefined()
      expect(nodeA?.dependencies).toEqual(['./b'])
    })

    it('handles files with no dependencies', () => {
      const files: FileInput[] = [
        {
          path: 'standalone.ts',
          content: 'export const value = 42',
          language: 'typescript',
        },
      ]

      const result = parser.parseProject(files)

      expect(result.files).toHaveLength(1)
      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].dependencies).toEqual([])
    })
  })
})
