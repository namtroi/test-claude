'use client';

import { FC, useState } from 'react';
import { Button } from './shared/Button';
import { useAnalyze } from '../hooks/useAnalyze';
import { useFiles } from '../hooks/useFiles';
import { useUiStore } from '../stores/uiStore';
import { selectDirectory, selectFiles, hasFileSystemAccess } from '../utils/file-handler';

export const Upload: FC = () => {
  const { files, addFiles, clearFiles } = useFiles();
  const { analyze } = useAnalyze();
  const { isLoading } = useUiStore();
  const [supportsFileSystemAccess] = useState(() => hasFileSystemAccess());

  const handleFolderSelect = async () => {
    if (!supportsFileSystemAccess) return;

    try {
      const fileInputs = await selectDirectory();
      addFiles(fileInputs);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Folder selection error:', err);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      try {
        const fileInputs = await selectFiles(e.target.files);
        addFiles(fileInputs);
      } catch (err) {
        console.error('File selection error:', err);
      }
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

          <div className="inline-block">
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
          </div>

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
