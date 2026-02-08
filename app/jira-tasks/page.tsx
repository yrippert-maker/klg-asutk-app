/**
 * Страница для просмотра задач из Jira
 * Данные импортируются из CSV файлов в папке "новая папка"
 */

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface JiraEpic {
  issueId: string;
  summary: string;
  description: string;
  priority: string;
  components: string[];
  labels: string[];
  stories?: JiraStory[];
  createdAt: string;
  updatedAt: string;
}

interface JiraStory {
  issueId: string;
  summary: string;
  description: string;
  priority: string;
  storyPoints?: number;
  components: string[];
  labels: string[];
  acceptanceCriteria?: string;
  subtasks?: JiraSubtask[];
  createdAt: string;
}

interface JiraSubtask {
  issueId: string;
  summary: string;
  description: string;
  priority: string;
  components: string[];
  labels: string[];
  createdAt: string;
}

interface Dependency {
  fromIssueId: string;
  toIssueId: string;
  linkType: string;
}

export default function JiraTasksPage() {
  const [epics, setEpics] = useState<JiraEpic[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/jira-tasks?type=epic');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEpics(data.data || []);
      setDependencies(data.dependencies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки задач');
      console.error('Ошибка загрузки задач:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority || 'Не указан';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Загрузка задач...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: '#f44336', marginBottom: '20px' }}>
          ❌ Ошибка: {error}
        </div>
        <button
          onClick={loadTasks}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Повторить загрузку
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px', marginLeft: '250px' }}>
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              Задачи Jira (REFLY)
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Эпики, истории и подзадачи из импортированных CSV файлов
            </p>
          </div>
          <button
            onClick={loadTasks}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔄 Обновить
          </button>
        </div>

        {epics.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>Нет данных. Запустите импорт:</p>
            <code style={{ display: 'block', marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              npm run import:jira
            </code>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {epics.map((epic) => (
              <div
                key={epic.issueId}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>📋 {epic.summary}</span>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: getPriorityColor(epic.priority),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {getPriorityLabel(epic.priority)}
                      </span>
                      <span style={{ color: '#666', fontSize: '14px' }}>ID: {epic.issueId}</span>
                    </div>
                    {epic.description && (
                      <p style={{ color: '#666', margin: '8px 0', fontSize: '14px' }}>{epic.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {epic.components && epic.components.length > 0 && (
                        <div>
                          <strong>Компоненты:</strong> {epic.components.join(', ')}
                        </div>
                      )}
                      {epic.labels && epic.labels.length > 0 && (
                        <div>
                          <strong>Метки:</strong>{' '}
                          {epic.labels.map((label) => (
                            <span
                              key={label}
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '3px',
                                fontSize: '12px',
                                marginLeft: '4px',
                              }}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEpic(selectedEpic === epic.issueId ? null : epic.issueId)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedEpic === epic.issueId ? '#1e3a5f' : '#f5f5f5',
                      color: selectedEpic === epic.issueId ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedEpic === epic.issueId ? 'Скрыть' : 'Показать'} истории
                  </button>
                </div>

                {selectedEpic === epic.issueId && epic.stories && epic.stories.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                      Истории ({epic.stories.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {epic.stories.map((story) => (
                        <div
                          key={story.issueId}
                          style={{
                            padding: '15px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '6px',
                            borderLeft: '4px solid #2196f3',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                <span style={{ fontWeight: 'bold' }}>📝 {story.summary}</span>
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    backgroundColor: getPriorityColor(story.priority),
                                    color: 'white',
                                    fontSize: '11px',
                                  }}
                                >
                                  {getPriorityLabel(story.priority)}
                                </span>
                                {story.storyPoints && (
                                  <span style={{ fontSize: '12px', color: '#666' }}>
                                    {story.storyPoints} SP
                                  </span>
                                )}
                                <span style={{ fontSize: '12px', color: '#999' }}>ID: {story.issueId}</span>
                              </div>
                              {story.description && (
                                <p style={{ color: '#666', fontSize: '13px', margin: '5px 0' }}>{story.description}</p>
                              )}
                              {story.acceptanceCriteria && (
                                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                                  <strong style={{ fontSize: '12px' }}>Критерии приемки:</strong>
                                  <pre style={{ fontSize: '12px', margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                    {story.acceptanceCriteria}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>

                          {story.subtasks && story.subtasks.length > 0 && (
                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                              <strong style={{ fontSize: '12px' }}>Подзадачи ({story.subtasks.length}):</strong>
                              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                {story.subtasks.map((subtask) => (
                                  <li key={subtask.issueId} style={{ fontSize: '12px', margin: '3px 0' }}>
                                    {subtask.summary} <span style={{ color: '#999' }}>({subtask.issueId})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {dependencies.length > 0 && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              Зависимости между задачами ({dependencies.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
              {dependencies.map((dep, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <strong>{dep.fromIssueId}</strong> → <strong>{dep.toIssueId}</strong>
                  <span style={{ color: '#666', marginLeft: '8px' }}>({dep.linkType})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
