import type { FileInput, Language } from '@repo-viz/shared'
import { EXCLUDE_PATTERNS } from '../constants/exclude-patterns'

const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const

export const hasFileSystemAccess = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

const getLanguage = (fileName: string): Language => {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
    return 'typescript'
  }
  return 'javascript'
}

const isValidSourceFile = (fileName: string): boolean => {
  return VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))
}

const shouldExclude = (path: string): boolean => {
  const normalizedPath = path.toLowerCase().replace(/\\/g, '/')
  return EXCLUDE_PATTERNS.some((pattern) => normalizedPath.includes(pattern.toLowerCase()))
}

async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  basePath = '',
  stats = { excluded: 0, included: 0 }
): Promise<FileInput[]> {
  const files: FileInput[] = []

  for await (const entry of dirHandle.values()) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name

    // Skip excluded paths
    if (shouldExclude(path)) {
      stats.excluded++
      console.log(`[EXCLUDED] ${path}`)
      continue
    }

    if (entry.kind === 'file') {
      if (isValidSourceFile(entry.name)) {
        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()
        const content = await file.text()

        stats.included++
        console.log(`[INCLUDED] ${path}`)
        files.push({
          path,
          content,
          language: getLanguage(entry.name),
        })
      }
    } else if (entry.kind === 'directory') {
      const subFiles = await readDirectoryRecursive(
        entry as FileSystemDirectoryHandle,
        path,
        stats
      )
      files.push(...subFiles)
    }
  }

  return files
}

export async function selectDirectory(): Promise<FileInput[]> {
  if (!hasFileSystemAccess()) {
    throw new Error('File System Access API not supported')
  }

  try {
    console.log('🔍 Exclude patterns:', EXCLUDE_PATTERNS)
    const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    const stats = { excluded: 0, included: 0 }
    const files = await readDirectoryRecursive(dirHandle, '', stats)

    console.log(`\n📊 FILE STATS:`)
    console.log(`✅ Included: ${stats.included} files`)
    console.log(`❌ Excluded: ${stats.excluded} items`)
    console.log(`📦 Total: ${stats.included + stats.excluded}\n`)

    if (files.length === 0) {
      throw new Error('No source files found in directory')
    }

    return files
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Directory selection cancelled')
      }
      throw error
    }
    throw new Error('Failed to read directory')
  }
}

export async function selectFiles(fileList: FileList): Promise<FileInput[]> {
  const files: FileInput[] = []
  let excluded = 0

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    const path = file.webkitRelativePath || file.name

    // Skip excluded paths
    if (shouldExclude(path)) {
      excluded++
      console.log(`[EXCLUDED] ${path}`)
      continue
    }

    if (isValidSourceFile(file.name)) {
      const content = await file.text()
      console.log(`[INCLUDED] ${path}`)
      files.push({
        path: file.webkitRelativePath || file.name,
        content,
        language: getLanguage(file.name),
      })
    }
  }

  console.log(`\n📊 FILE STATS:`)
  console.log(`✅ Included: ${files.length} files`)
  console.log(`❌ Excluded: ${excluded} items`)
  console.log(`📦 Total: ${files.length + excluded}\n`)

  if (files.length === 0) {
    throw new Error('No valid source files selected')
  }

  return files
}
