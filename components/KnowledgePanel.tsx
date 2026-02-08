'use client';

import { useState, useEffect } from 'react';

interface Insight {
  id: string;
  content: string;
  metadata: {
    category?: string;
    severity?: string;
    confidence?: number;
  };
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
  suggestedActions: string[];
}

interface KnowledgePanelProps {
  entityId?: string;
  entityType?: 'aircraft' | 'audit' | 'risk';
  onInsightClick?: (insight: Insight) => void;
}

export default function KnowledgePanel({ 
  entityId, 
  entityType,
  onInsightClick 
}: KnowledgePanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');

  useEffect(() => {
    if (entityId && entityType) {
      loadKnowledge();
    }
  }, [entityId, entityType]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      // Загружаем инсайты
      const insightsRes = await fetch('/api/knowledge/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{ id: entityId, type: entityType }],
          context: `${entityType} ${entityId}`,
        }),
      });
      const insightsData = await insightsRes.json();
      setInsights(insightsData.insights || []);

      // Загружаем рекомендации
      const recRes = await fetch('/api/knowledge/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [String(entityType)]: [{ id: entityId }],
        }),
      });
      const recData = await recRes.json();
      setRecommendations(recData.recommendations || []);
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('insights')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'insights' ? '2px solid #2196f3' : '2px solid transparent',
            color: activeTab === 'insights' ? '#2196f3' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'insights' ? '500' : '400',
          }}
        >
          Инсайты ({insights.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'recommendations' ? '2px solid #2196f3' : '2px solid transparent',
            color: activeTab === 'recommendations' ? '#2196f3' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'recommendations' ? '500' : '400',
          }}
        >
          Рекомендации ({recommendations.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Анализ данных...
        </div>
      ) : activeTab === 'insights' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Инсайты не найдены
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                onClick={() => onInsightClick?.(insight)}
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  cursor: onInsightClick ? 'pointer' : 'default',
                  borderLeft: `4px solid ${
                    insight.metadata.severity === 'high' ? '#f44336' :
                    insight.metadata.severity === 'medium' ? '#ff9800' :
                    '#4caf50'
                  }`,
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {insight.content}
                </div>
                {insight.metadata.confidence && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Уверенность: {Math.round(insight.metadata.confidence * 100)}%
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Рекомендации не найдены
            </div>
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${
                    rec.priority === 'critical' ? '#f44336' :
                    rec.priority === 'high' ? '#ff9800' :
                    rec.priority === 'medium' ? '#2196f3' :
                    '#4caf50'
                  }`,
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {rec.title}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {rec.description}
                </div>
                {rec.suggestedActions.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                      Рекомендуемые действия:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
                      {rec.suggestedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
