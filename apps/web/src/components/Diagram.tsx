'use client';

import { FC, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useAppStore } from '../stores/appStore';
import { Spinner } from './shared/Spinner';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export const Diagram: FC = () => {
  const currentAnalysis = useAppStore((state) => state.currentAnalysis);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 Diagram render - currentAnalysis:', currentAnalysis);

  useEffect(() => {
    console.log('📊 Diagram useEffect - currentAnalysis:', currentAnalysis);
    if (!currentAnalysis?.mermaid || !containerRef.current) {
      console.log('⚠️ Diagram - No mermaid data or container');
      return;
    }

    const renderDiagram = async () => {
      console.log('🎨 Starting mermaid render...');
      setIsRendering(true);
      setError(null);

      try {
        const { svg } = await mermaid.render(
          `mermaid-diagram-${Date.now()}`,
          currentAnalysis.mermaid
        );

        console.log('✅ Mermaid rendered successfully');
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('❌ Mermaid render error:', err);
        setError('Failed to render diagram');
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [currentAnalysis]);

  if (!currentAnalysis) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No analysis data. Upload files to get started.</p>
      </div>
    );
  }

  if (isRendering) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Architecture Diagram</h2>
      <div
        ref={containerRef}
        className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg p-4"
      />
    </div>
  );
};
