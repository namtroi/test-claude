'use client';

import { FC } from 'react';
import { useAppStore } from '../stores/appStore';

export const DriftViewer: FC = () => {
  const { driftResult, previousSnapshot } = useAppStore();

  if (!previousSnapshot) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Import a snapshot to detect drift.</p>
      </div>
    );
  }

  if (!driftResult) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Analyze files to detect drift.</p>
      </div>
    );
  }

  const { added, removed, modified } = driftResult;
  const hasChanges = added.length > 0 || removed.length > 0 || modified.length > 0;

  if (!hasChanges) {
    return (
      <div className="flex items-center justify-center h-64 bg-green-50 rounded-lg">
        <p className="text-green-700">No drift detected. Architecture unchanged.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Drift Detection</h2>

      <div className="space-y-6">
        {added.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-green-700 mb-2">
              Added Files ({added.length})
            </h3>
            <ul className="space-y-1">
              {added.map((file, idx) => (
                <li
                  key={idx}
                  className="bg-green-50 border-l-4 border-green-500 px-4 py-2 text-sm text-gray-800"
                >
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}

        {removed.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-red-700 mb-2">
              Removed Files ({removed.length})
            </h3>
            <ul className="space-y-1">
              {removed.map((file, idx) => (
                <li
                  key={idx}
                  className="bg-red-50 border-l-4 border-red-500 px-4 py-2 text-sm text-gray-800"
                >
                  {file}
                </li>
              ))}
            </ul>
          </div>
        )}

        {modified.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-orange-700 mb-2">
              Modified Files ({modified.length})
            </h3>
            <ul className="space-y-2">
              {modified.map((file, idx) => (
                <li
                  key={idx}
                  className="bg-orange-50 border-l-4 border-orange-500 px-4 py-2"
                >
                  <p className="text-sm font-medium text-gray-800">{file}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
