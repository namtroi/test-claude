'use client';

import { FC, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useAppStore } from '../stores/appStore';
import { Spinner } from './shared/Spinner';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#e3f2fd',
    primaryTextColor: '#000',
    primaryBorderColor: '#1976d2',
    lineColor: '#1976d2',
    secondaryColor: '#fff3e0',
    tertiaryColor: '#f3e5f5',
    background: '#fff',
    mainBkg: '#e3f2fd',
    textColor: '#000',
    nodeBorder: '#1976d2',
    clusterBkg: '#ffe6cc',
    clusterBorder: '#ff9933',
    fontSize: '16px'
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

export const Diagram: FC = () => {
  const { currentAnalysis } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  console.log('🔵 Diagram component render:', {
    hasCurrentAnalysis: !!currentAnalysis,
    hasMermaid: !!currentAnalysis?.mermaid,
    mermaidLength: currentAnalysis?.mermaid?.length,
    containerRefExists: !!containerRef.current,
    isRendering,
    error,
    renderKey
  });

  useEffect(() => {
    console.log('🟡 Diagram useEffect triggered:', {
      hasAnalysis: !!currentAnalysis,
      hasMermaid: !!currentAnalysis?.mermaid,
      hasContainer: !!containerRef.current,
      mermaidSyntax: currentAnalysis?.mermaid
    });

    if (!currentAnalysis?.mermaid) {
      console.log('⚠️ Diagram useEffect: Early return - no mermaid data');
      return;
    }

    // Wait a tick to ensure the ref is attached
    const timeoutId = setTimeout(async () => {
      if (!containerRef.current) {
        console.log('⚠️ Diagram useEffect: Container ref still not ready, forcing re-render');
        setRenderKey(k => k + 1);
        return;
      }

      console.log('🟣 Starting mermaid render...');
      setIsRendering(true);
      setError(null);

      try {
        const { svg } = await mermaid.render(
          `mermaid-diagram-${Date.now()}`,
          currentAnalysis.mermaid
        );

        console.log('✅ Mermaid render successful, SVG length:', svg.length);
        console.log('📝 SVG content preview:', svg.substring(0, 500));

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          console.log('✅ SVG inserted into container');
          
          // Ensure SVG is visible
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // If SVG has no width/height, set them based on viewBox
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox && (!svgElement.getAttribute('width') || !svgElement.getAttribute('height'))) {
              const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
              // Set reasonable size based on viewBox
              svgElement.setAttribute('width', `${Math.min(vbWidth, 800)}`);
              svgElement.setAttribute('height', `${Math.min(vbHeight, 600)}`);
            }
            
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            console.log('✅ SVG styling applied', {
              width: svgElement.getAttribute('width'),
              height: svgElement.getAttribute('height'),
              viewBox: svgElement.getAttribute('viewBox'),
              computedWidth: svgElement.getBoundingClientRect().width,
              computedHeight: svgElement.getBoundingClientRect().height
            });
          }
        }
      } catch (err) {
        console.error('❌ Mermaid render error:', err);
        setError('Failed to render diagram');
      } finally {
        setIsRendering(false);
      }
    }, 0); // Wait one tick for ref to attach

    return () => clearTimeout(timeoutId);
  }, [currentAnalysis, renderKey]); // Include renderKey to force re-render if ref wasn't ready

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
        className="overflow-auto max-h-[600px] min-h-[400px] border border-gray-200 rounded-lg p-4 bg-white"
        style={{ width: '100%' }}
      />
    </div>
  );
};
