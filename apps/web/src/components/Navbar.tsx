'use client';

import { FC } from 'react';
import { Button } from './shared/Button';
import { useAppStore } from '../stores/appStore';

export const Navbar: FC = () => {
  const { currentAnalysis, exportSnapshot, clearAnalysis } = useAppStore();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-blue-600">RepoViz</div>
          <span className="text-sm text-gray-500">Repository Visualizer</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={exportSnapshot}
            disabled={!currentAnalysis}
          >
            Export Snapshot
          </Button>
          <Button
            variant="danger"
            onClick={clearAnalysis}
            disabled={!currentAnalysis}
          >
            Clear
          </Button>
        </div>
      </div>
    </nav>
  );
};
