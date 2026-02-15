'use client';

import { useEffect, useRef, useState } from 'react';
import { logError } from '@/lib/logger-client';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  [key: string]: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface KnowledgeGraphVisualizationProps {
  query?: string;
  onNodeClick?: (nodeId: string) => void;
}

export default function KnowledgeGraphVisualization({
  query,
  onNodeClick,
}: KnowledgeGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        setError(null);
        // Модуль knowledge вынесен в отдельный сервис (КЛГ АСУ ТК не использует локальную папку knowledge/)
        setGraph({ nodes: [], edges: [] });
        setLoading(false);
        return;
      } catch (err) {
        logError('Knowledge graph unavailable', err);
        setError('Модуль графа знаний вынесен в отдельный сервис');
      } finally {
        setLoading(false);
      }
    };
    loadGraph();
  }, [query]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Загрузка графа знаний...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#f44336', marginBottom: '8px' }}>
          Ошибка: {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Граф знаний пуст</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ padding: '8px', fontSize: '12px', color: '#666', backgroundColor: '#f5f5f5' }}>
        Узлов: {graph.nodes.length} | Связей: {graph.edges.length}
      </div>
    </div>
  );
}
