'use client'

import { Modal } from './shared/Modal'
import { Button } from './shared/Button'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: {
    message: string
    requestId?: string
    details?: unknown
  }
  onRetry?: () => void
}

export function ErrorModal({ isOpen, onClose, error, onRetry }: ErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">{error.message}</p>

          {error.requestId && (
            <p className="text-sm text-gray-500">
              Request ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{error.requestId}</code>
            </p>
          )}
        </div>

        {error.details && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-end">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
