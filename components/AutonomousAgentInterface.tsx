'use client';

import { useState } from 'react';

interface AgentResponse {
  answer: string;
  reasoning: string[];
  actions?: Array<{
    type: string;
    description: string;
    executed: boolean;
    result?: any;
  }>;
  confidence: number;
  mode: 'copilot' | 'autonomous';
  intent?: {
    intent: string;
    confidence: number;
  };
}

export default function AutonomousAgentInterface() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'copilot' | 'autonomous'>('copilot');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      // Ошибка уже обработана в API
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
        Автономный агент
      </h2>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>
          Режим:
        </label>
        <button
          onClick={() => setMode('copilot')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: mode === 'copilot' ? '#2196f3' : '#e0e0e0',
            color: mode === 'copilot' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Copilot
        </button>
        <button
          onClick={() => setMode('autonomous')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: mode === 'autonomous' ? '#2196f3' : '#e0e0e0',
            color: mode === 'autonomous' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Autonomous
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === 'copilot'
              ? 'Задайте вопрос или попросите помощи...'
              : 'Опишите задачу, которую нужно выполнить...'
          }
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            backgroundColor: loading || !query.trim() ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {loading ? 'Обработка...' : 'Отправить'}
        </button>
      </form>

      {response && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Ответ:
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {response.answer}
            </div>
          </div>

          {response.reasoning && response.reasoning.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Рассуждения:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                {response.reasoning.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ol>
            </div>
          )}

          {response.actions && response.actions.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Действия:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                {response.actions.map((action, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    {action.description}
                    {action.executed && (
                      <span style={{ color: '#4caf50', marginLeft: '8px' }}>✓ Выполнено</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
            Уверенность: {Math.round(response.confidence * 100)}%
            {response.intent && ` • Намерение: ${response.intent.intent}`}
          </div>
        </div>
      )}
    </div>
  );
}
