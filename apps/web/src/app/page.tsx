'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Upload } from '../components/Upload';
import { Diagram } from '../components/Diagram';
import { DriftViewer } from '../components/DriftViewer';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SnapshotManager } from '../components/SnapshotManager';
import { useUiStore } from '../stores/uiStore';

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'diagram' | 'drift'>('diagram');
  const [mounted, setMounted] = useState(false);
  const { error, clearError } = useUiStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-red-700 hover:text-red-900 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Upload />
              <SnapshotManager />
            </div>

            <div className="lg:col-span-2">
              <div className="mb-4 flex space-x-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('diagram')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'diagram'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Diagram
                </button>
                <button
                  onClick={() => setActiveTab('drift')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'drift'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Drift
                </button>
              </div>

              {activeTab === 'diagram' ? <Diagram /> : <DriftViewer />}
            </div>
          </div>
        </div>
      </main>

      <LoadingOverlay />
    </>
  );
}
