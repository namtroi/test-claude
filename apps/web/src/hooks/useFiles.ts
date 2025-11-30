import { useState, useCallback } from 'react'
import type { FileInput } from '@repo-viz/shared'

const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

export const useFiles = () => {
  const [files, setFiles] = useState<FileInput[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((fileName: string): boolean => {
    return VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))
  }, [])

  const addFiles = useCallback(
    (newFiles: FileInput[]) => {
      const validFiles = newFiles.filter((file) => validateFile(file.path))

      if (validFiles.length === 0) {
        setError('No valid TypeScript/JavaScript files found')
        return
      }

      if (validFiles.length !== newFiles.length) {
        setError(`Filtered out ${newFiles.length - validFiles.length} non-source files`)
      } else {
        setError(null)
      }

      setFiles(validFiles)
    },
    [validateFile]
  )

  const clearFiles = useCallback(() => {
    setFiles([])
    setError(null)
  }, [])

  return {
    files,
    error,
    addFiles,
    clearFiles,
    validateFile,
  }
}
