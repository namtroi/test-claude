'use client';

import { FC, useState } from 'react';
import { Button } from './shared/Button';
import { useAnalyze } from '../hooks/useAnalyze';
import { useFiles } from '../hooks/useFiles';
import { useUiStore } from '../stores/uiStore';

export const Upload: FC = () => {
  const { files, addFiles, clearFiles } = useFiles();
  const { analyze } = useAnalyze();
  const { isLoading } = useUiStore();
  const [supportsFileSystemAccess] = useState(() => 'showDirectoryPicker' in window);

  const handleFolderSelect = async () => {
    if (!supportsFileSystemAccess) return;

    try {
      const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
      const browserFiles = await readDirectory(dirHandle);
      const fileInputs = await convertToFileInputs(browserFiles);
      addFiles(fileInputs);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Folder selection error:', err);
      }
    }
  };

  const readDirectory = async (dirHandle: FileSystemDirectoryHandle, path = ''): Promise<File[]> => {
    const browserFiles: File[] = [];
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === 'file') {
        const ext = entry.name.substring(entry.name.lastIndexOf('.'));
        if (validExtensions.includes(ext)) {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          browserFiles.push(new File([file], entryPath, { type: file.type }));
        }
      } else if (entry.kind === 'directory') {
        const subDirHandle = entry as FileSystemDirectoryHandle;
        const subFiles = await readDirectory(subDirHandle, entryPath);
        browserFiles.push(...subFiles);
      }
    }

    return browserFiles;
  };

  const convertToFileInputs = async (browserFiles: File[]) => {
    const fileInputs = await Promise.all(
      browserFiles.map(async (file) => {
        const content = await file.text();
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        const language = ext === '.ts' || ext === '.tsx' ? 'typescript' : 'javascript';
        return { path: file.name, content, language: language as 'typescript' | 'javascript' };
      })
    );
    return fileInputs;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const browserFiles = Array.from(e.target.files);
      const fileInputs = await convertToFileInputs(browserFiles);
      addFiles(fileInputs);
    }
  };

  const handleAnalyze = () => {
    if (files.length > 0) {
      analyze({ files });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {supportsFileSystemAccess && (
            <Button
              variant="primary"
              onClick={handleFolderSelect}
              disabled={isLoading}
            >
              Select Folder
            </Button>
          )}

          <label className="inline-block">
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Select Files
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".ts,.tsx,.js,.jsx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <Button
              variant="danger"
              onClick={clearFiles}
              disabled={isLoading}
            >
              Clear
            </Button>
          )}
        </div>

        {files.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleAnalyze}
          disabled={files.length === 0 || isLoading}
          className="w-full"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </Button>

        {!supportsFileSystemAccess && (
          <p className="text-xs text-gray-500">
            Folder selection not supported. Use file selection or try Chrome/Edge.
          </p>
        )}
      </div>
    </div>
  );
};
