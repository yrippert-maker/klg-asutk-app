'use client';

import { useEffect, useRef, useState } from 'react';
import { logInfo, logError } from '@/lib/logger-client';

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
    let visNetwork: any = null;

    const loadGraph = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = query
          ? `/api/knowledge/graph?query=${encodeURIComponent(query)}&format=visualization`
          : '/api/knowledge/graph?format=visualization';

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setGraph(data);

        // Динамически загружаем vis-network и vis-data
        let Network: any = null;
        let DataSet: any = null;
        
        try {
          // Импортируем vis-network для Network
          const visNetwork = await import('vis-network');
          Network = visNetwork.Network || visNetwork.default?.Network || visNetwork.default || visNetwork;
          
          // Импортируем vis-data для DataSet
          const visData = await import('vis-data');
          DataSet = visData.DataSet || visData.default?.DataSet || visData.default || visData;
          
          // Если не получилось через ESM, пробуем через require (для SSR)
          if (!Network || !DataSet) {
            if (typeof window === 'undefined') {
              const visNetworkReq = require('vis-network');
              Network = visNetworkReq.Network || visNetworkReq.default?.Network || visNetworkReq;

              const visDataReq = require('vis-data');
              DataSet = visDataReq.DataSet || visDataReq.default?.DataSet || visDataReq;
            }
          }
        } catch (err) {
          logError('vis-network/vis-data import error', err);
          setError(`Ошибка загрузки библиотек визуализации: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
          setLoading(false);
          return;
        }
        
        if (!Network) {
          logError('vis-network Network not found');
          setError('vis-network Network не найден');
          setLoading(false);
          return;
        }
        
        if (!DataSet) {
          logError('vis-data DataSet not found');
          setError('vis-data DataSet не найден. Установите: npm install vis-data');
          setLoading(false);
          return;
        }

        if (!containerRef.current) {
          return;
        }

        // Подготовка данных для vis-network
        const nodes = new DataSet(
          data.nodes.map((node: GraphNode) => {
            // Создаем новый объект без id, чтобы избежать дублирования
            const { id, label, type, ...restNode } = node;
            return {
              id,
              label: label || id,
              group: type,
              title: `${type}: ${label}\n${JSON.stringify(node, null, 2)}`,
              ...restNode,
            };
          })
        );

        const edges = new DataSet(
          data.edges.map((edge: GraphEdge) => ({
            id: edge.id,
            from: edge.source,
            to: edge.target,
            label: edge.type,
            value: edge.weight,
            title: `${edge.type} (weight: ${edge.weight})`,
          }))
        );

        const networkData = { nodes, edges };

        const options = {
          nodes: {
            shape: 'dot',
            size: 16,
            font: {
              size: 12,
              color: '#333',
            },
            borderWidth: 2,
            shadow: true,
          },
          edges: {
            width: 2,
            color: { color: '#848484' },
            smooth: {
              type: 'continuous',
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.5,
              },
            },
            font: {
              size: 10,
              align: 'middle',
            },
          },
          physics: {
            enabled: true,
            stabilization: {
              iterations: 200,
            },
          },
          interaction: {
            hover: true,
            tooltipDelay: 100,
            zoomView: true,
            dragView: true,
          },
          groups: {
            aircraft: { color: { background: '#2196f3', border: '#1976d2' } },
            audit: { color: { background: '#ff9800', border: '#f57c00' } },
            risk: { color: { background: '#f44336', border: '#d32f2f' } },
            operator: { color: { background: '#4caf50', border: '#388e3c' } },
            regulation: { color: { background: '#9c27b0', border: '#7b1fa2' } },
            document: { color: { background: '#00bcd4', border: '#0097a7' } },
          },
        };

        visNetwork = new Network(containerRef.current, networkData, options);

        // Обработка клика на узел
        visNetwork.on('click', (params: any) => {
          if (params.nodes.length > 0 && onNodeClick) {
            onNodeClick(params.nodes[0]);
          }
        });

        logInfo('Knowledge graph visualization loaded', {
          nodes: data.nodes.length,
          edges: data.edges.length,
        });
      } catch (err: any) {
        logError('Failed to load knowledge graph visualization', err);
        setError(err.message || 'Ошибка загрузки графа знаний');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();

    return () => {
      if (visNetwork) {
        visNetwork.destroy();
      }
    };
  }, [query, onNodeClick]);

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
