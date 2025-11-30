'use client';

import { FC, useEffect, useState } from 'react';
import { Spinner } from './shared/Spinner';
import { Button } from './shared/Button';
import { useUiStore } from '../stores/uiStore';

interface LoadingOverlayProps {
  onCancel?: () => void;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({ onCancel }) => {
  const { isLoading } = useUiStore();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-700 font-medium">Processing files...</p>

        {showTimeout && (
          <p className="text-sm text-orange-600">
            This is taking longer than expected...
          </p>
        )}

        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
