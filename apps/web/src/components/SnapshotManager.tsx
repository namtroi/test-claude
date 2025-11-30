'use client';

import { FC, useRef } from 'react';
import { Button } from './shared/Button';
import { useAppStore } from '../stores/appStore';
import { AnalyzeResponseSchema } from '@repo-viz/shared';

export const SnapshotManager: FC = () => {
  const { setPreviousSnapshot } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const json = JSON.parse(content);

      const validated = AnalyzeResponseSchema.parse(json);
      setPreviousSnapshot(validated);

      alert('Snapshot imported successfully');
    } catch (err) {
      console.error('Import error:', err);
      alert('Invalid snapshot file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-4">
      <Button variant="secondary" onClick={handleImport}>
        Import Snapshot
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
